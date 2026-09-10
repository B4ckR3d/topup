// import type { HttpContext } from '@adonisjs/core/http'

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import { count, desc, eq } from '@umbreon/db'
import { tb } from '@umbreon/db/types'
import vine from '@vinejs/vine'
import sharp from 'sharp'
import { db } from '#database/db'
import env from '#start/env'
import {
  deleteFilesValidator,
  deleteFileValidator,
  listFileQueryValidator,
} from '#validators/file_manager'

export default class FileManagersController {
  private getS3PublicBase() {
    const customUrl = env.get('VITE_S3_URL') || env.get('S3_URL')
    if (customUrl && !customUrl.includes(':9000')) {
      return customUrl.replace(/\/+$/, '')
    }
    return ''
  }

  public async serveImage({ params, response }: HttpContext) {
    try {
      const fileName = params.fileName
      if (!fileName || fileName.includes('..') || fileName.includes('/')) {
        return response.status(400).send('Invalid file name')
      }

      const disk = drive.use('s3')
      const filePath = `storage/images/${fileName}`

      const exists = await disk.exists(filePath)
      if (!exists) {
        return response.status(404).send('Image not found')
      }

      const stream = await disk.getStream(filePath)

      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        webp: 'image/webp',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        svg: 'image/svg+xml',
        gif: 'image/gif',
        avif: 'image/avif',
      }
      const mimeType = (ext && mimeTypes[ext]) || 'image/webp'

      response.header('Content-Type', mimeType)
      response.header('Cache-Control', 'public, max-age=31536000, immutable')
      return response.stream(stream)
    } catch (error) {
      console.error('[FileManager] Failed to serve image:', error)
      return response.status(500).send('Error loading image')
    }
  }

  public async upload(ctx: HttpContext) {
    try {
      const file = ctx.request.file('file') || ctx.request.file('files')
      if (!file) {
        return ctx.response.status(400).json({
          error: 'Tidak ada file yang dipilih untuk diunggah.',
        })
      }

      if (!file.isValid) {
        return ctx.response.status(400).json({
          error: file.errors?.[0]?.message || 'File yang dipilih tidak valid.',
        })
      }

      const disk = drive.use('s3')
      const s3PublicBase = this.getS3PublicBase()

      if (!file.tmpPath) {
        return ctx.response.status(400).json({
          error: 'File sementara tidak ditemukan di server.',
        })
      }

      const fileBuffer = await fs.readFile(file.tmpPath)
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
      const filePath = `storage/images/${fileHash}.webp`

      let exist = false
      try {
        exist = await disk.exists(filePath)
      } catch (storageErr: any) {
        console.error('[FileManager] MinIO storage check failed:', storageErr)
        return ctx.response.status(500).json({
          error: `Koneksi MinIO/S3 bermasalah: ${storageErr?.message || storageErr}`,
        })
      }

      if (exist) {
        const existing = await db.query.fileManager.findFirst({
          where: eq(tb.fileManager.name, `${fileHash}.webp`),
        })
        if (existing) {
          return ctx.response.json({
            message: 'File already exists',
            file: {
              id: existing.id,
              name: existing.name,
              url: `${s3PublicBase}/storage/images/${fileHash}.webp`,
            },
          })
        }
      }

      let convertedImage: Buffer
      try {
        convertedImage = await sharp(file.tmpPath).toFormat('webp').toBuffer()
      } catch {
        convertedImage = fileBuffer
      }

      try {
        await disk.put(filePath, convertedImage, {
          visibility: 'public',
        })
      } catch (putErr: any) {
        console.error('[FileManager] MinIO put failed:', putErr)
        return ctx.response.status(500).json({
          error: `Gagal menyimpan file ke MinIO/S3: ${putErr?.message || putErr}`,
        })
      }

      const fileSize = convertedImage.byteLength
      const save = await db
        .insert(tb.fileManager)
        .values({
          name: `${fileHash}.webp`,
          url: `/storage/images/${fileHash}.webp`,
          size: fileSize,
          mime_type: 'image/webp',
        })
        .returning()

      return ctx.response.json({
        message: 'File uploaded successfully',
        file: {
          id: save[0].id,
          name: `${fileHash}.webp`,
          url: `${s3PublicBase}/storage/images/${fileHash}.webp`,
        },
      })
    } catch (error: any) {
      console.error('File upload error:', error)
      return ctx.response.status(500).json({
        error: error?.message || 'Terjadi kesalahan saat mengunggah file. Silakan coba lagi.',
        details: error?.message || String(error),
      })
    }
  }

  public async uploadMany(ctx: HttpContext) {
    try {
      // 1. Support single file or array of files from 'files' or 'files[]' or 'file' or allFiles
      let filesToProcess: any[] = []
      const filesArray = ctx.request.files('files')
      const filesArrayBracket = ctx.request.files('files[]')
      const singleFile = ctx.request.file('files') || ctx.request.file('file')

      if (filesArray && filesArray.length > 0) {
        filesToProcess = filesArray
      } else if (filesArrayBracket && filesArrayBracket.length > 0) {
        filesToProcess = filesArrayBracket
      } else if (singleFile) {
        filesToProcess = [singleFile]
      } else {
        const allFiles = ctx.request.allFiles()
        for (const key of Object.keys(allFiles)) {
          const val = allFiles[key]
          if (Array.isArray(val)) {
            filesToProcess.push(...val)
          } else if (val) {
            filesToProcess.push(val)
          }
        }
      }

      if (filesToProcess.length === 0) {
        return ctx.response.status(400).json({
          error: 'Tidak ada file yang dipilih atau file tidak diterima oleh server.',
        })
      }

      let disk: any
      try {
        disk = drive.use('s3')
      } catch (diskErr: any) {
        console.error('[FileManager] Driver initialization error:', diskErr)
        return ctx.response.status(500).json({
          error: `Konfigurasi MinIO/S3 tidak valid: ${diskErr?.message || diskErr}`,
        })
      }

      const uploaded: { id: string; name: string; url: string }[] = []
      const errors: { name: string; error: string }[] = []
      const s3PublicBase = this.getS3PublicBase()

      for (const file of filesToProcess) {
        if (!file.tmpPath) {
          errors.push({
            name: file.clientName || 'unknown',
            error: 'File sementara tidak ditemukan di server',
          })
          continue
        }

        if (file.hasErrors) {
          const errMsg = file.errors?.[0]?.message || 'File tidak valid'
          errors.push({ name: file.clientName || 'unknown', error: errMsg })
          continue
        }

        try {
          const fileBuffer = await fs.readFile(file.tmpPath)
          const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
          const filePath = `storage/images/${fileHash}.webp`

          let exist = false
          try {
            exist = await disk.exists(filePath)
          } catch (storageCheckErr: any) {
            console.error('[FileManager] Storage check failed:', storageCheckErr)
            throw new Error(`Koneksi MinIO gagal: ${storageCheckErr.message || storageCheckErr}`)
          }

          if (exist) {
            const existing = await db.query.fileManager.findFirst({
              where: eq(tb.fileManager.name, `${fileHash}.webp`),
            })
            if (existing) {
              uploaded.push({
                id: existing.id,
                name: existing.name,
                url: `${s3PublicBase}/storage/images/${fileHash}.webp`,
              })
              continue
            }
          }

          let convertedImage: Buffer
          try {
            convertedImage = await sharp(file.tmpPath).toFormat('webp').toBuffer()
          } catch {
            convertedImage = fileBuffer
          }

          try {
            await disk.put(filePath, convertedImage, {
              visibility: 'public',
            })
          } catch (putErr: any) {
            console.error('[FileManager] MinIO put failed:', putErr)
            throw new Error(`Gagal menyimpan file ke MinIO: ${putErr.message}`)
          }

          const fileSize = convertedImage.byteLength
          const save = await db
            .insert(tb.fileManager)
            .values({
              name: `${fileHash}.webp`,
              url: `/storage/images/${fileHash}.webp`,
              size: fileSize,
              mime_type: 'image/webp',
            })
            .returning()

          uploaded.push({
            id: save[0].id,
            name: `${fileHash}.webp`,
            url: `${s3PublicBase}/storage/images/${fileHash}.webp`,
          })
        } catch (fileErr: any) {
          console.error(`Failed to process file ${file.clientName}:`, fileErr)
          errors.push({ name: file.clientName, error: fileErr?.message || 'Processing failed' })
        }
      }

      if (uploaded.length === 0 && errors.length > 0) {
        return ctx.response.status(400).json({
          error: errors[0].error || 'Gagal mengunggah file.',
          errors,
        })
      }

      return ctx.response.json({
        message: 'Files uploaded',
        files: uploaded,
        errors,
      })
    } catch (error: any) {
      console.error('File upload error:', error)
      return ctx.response.status(500).json({
        error: error?.message || 'Terjadi kesalahan saat mengunggah file. Silakan coba lagi.',
        details: error?.message || String(error),
      })
    }
  }

  public async destroy(ctx: HttpContext) {
    try {
      const data = await ctx.request.validateUsing(vine.compile(deleteFileValidator), {
        data: ctx.request.params(),
      })

      const disk = drive.use('s3')

      const file = await db.query.fileManager.findFirst({
        where: eq(tb.fileManager.id, data.id),
      })

      if (!file) {
        return ctx.response.status(404).json({
          error: 'File not found',
        })
      }

      const storageKey = file.url.replace(/^\/+/, '')
      const check = await disk.exists(storageKey)

      if (!check) {
        await db.delete(tb.fileManager).where(eq(tb.fileManager.id, data.id))
        return ctx.response.status(404).json({
          error: 'File not found on disk',
        })
      }

      await disk.delete(storageKey)
      await db.delete(tb.fileManager).where(eq(tb.fileManager.id, data.id))

      return ctx.response.json({
        message: 'File deleted successfully',
      })
    } catch (error: any) {
      console.error('File deletion error:', error)
      return ctx.response.status(500).json({
        error: 'An error occurred while deleting the file. Please try again later.',
        details: error?.message || String(error),
      })
    }
  }

  public async destroyBulk(ctx: HttpContext) {
    try {
      const data = await ctx.request.validateUsing(vine.compile(deleteFilesValidator))
      const disk = drive.use('s3')
      const deleted: string[] = []
      const errors: { id: string; error: string }[] = []

      for (const id of data.ids) {
        try {
          const file = await db.query.fileManager.findFirst({
            where: eq(tb.fileManager.id, id),
          })

          if (!file) {
            errors.push({ id, error: 'File not found' })
            continue
          }

          const storageKey = file.url.replace(/^\/+/, '')
          const check = await disk.exists(storageKey)

          if (!check) {
            await db.delete(tb.fileManager).where(eq(tb.fileManager.id, id))
            deleted.push(id)
            continue
          }

          await disk.delete(storageKey)
          await db.delete(tb.fileManager).where(eq(tb.fileManager.id, id))
          deleted.push(id)
        } catch (itemErr: any) {
          console.error(`Failed to delete file id ${id}:`, itemErr)
          errors.push({ id, error: itemErr?.message || 'Delete failed' })
        }
      }

      return ctx.response.json({
        message: 'Files deleted',
        deleted,
        errors,
      })
    } catch (error: any) {
      console.error('File deletion error:', error)
      return ctx.response.status(500).json({
        error: 'An error occurred while deleting the files. Please try again later.',
        details: error?.message || String(error),
      })
    }
  }

  public async list(ctx: HttpContext) {
    try {
      const { page = 1, limit = 20 } = await ctx.request.validateUsing(
        vine.compile(listFileQueryValidator),
      )

      const files = await db.query.fileManager.findMany({
        orderBy: [desc(tb.fileManager.created_at)],
        offset: (page - 1) * limit,
        limit,
      })

      const [fCount] = await db
        .select({
          count: count(tb.fileManager.id),
        })
        .from(tb.fileManager)

      return ctx.response.json({
        data: files,
        pagination: {
          page,
          limit,
          total: Number(fCount.count),
          totalPages: Math.ceil(Number(fCount.count) / limit),
        },
      })
    } catch (_) {
      // console.error('File list error:', error)
      return ctx.response.status(500).json({
        error: 'An error occurred while fetching the file list. Please try again later.',
      })
    }
  }

  public async getById(ctx: HttpContext) {
    try {
      const { id } = await ctx.request.validateUsing(vine.compile(deleteFileValidator), {
        data: ctx.request.params(),
      })

      const file = await db.query.fileManager.findFirst({
        where: eq(tb.fileManager.id, id),
      })

      if (!file) {
        return ctx.response.status(404).json({
          error: 'File not found',
        })
      }

      return ctx.response.json({
        data: file,
      })
    } catch (_) {
      return ctx.response.status(500).json({
        error: 'An error occurred while fetching the file. Please try again later.',
      })
    }
  }
}
