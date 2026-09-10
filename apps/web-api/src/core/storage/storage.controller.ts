import { BadRequestException, Controller, Get, NotFoundException, Param, Res } from '@nestjs/common'
import type { Response } from 'express'
import { StorageService } from './storage.service'

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('images/:fileName')
  async serveImage(@Param('fileName') fileName: string, @Res() res: Response) {
    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      throw new BadRequestException('Invalid file name')
    }

    const path = `storage/images/${fileName}`
    const exists = await this.storageService.fileExists(path)
    if (!exists) {
      throw new NotFoundException('Image not found')
    }

    const stream = await this.storageService.getFileStream(path)
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
    res.setHeader('Content-Type', mimeTypes[ext || ''] || 'image/webp')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return (stream as any).pipe(res)
  }
}
