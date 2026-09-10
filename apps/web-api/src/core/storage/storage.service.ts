import { Injectable, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Disk } from 'flydrive'
import { S3Driver } from 'flydrive/drivers/s3'

@Injectable()
export class StorageService implements OnModuleInit {
  private disk: Disk

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>('S3_ENDPOINT')
    this.disk = new Disk(
      new S3Driver({
        credentials: {
          accessKeyId: this.configService.get('S3_ACCESS_KEY_ID') || 'minioadmin',
          secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY') || 'minioadmin',
        },
        region: this.configService.get('S3_REGION') || 'us-east-1',
        bucket: this.configService.get('S3_BUCKET_NAME') || 'umbreon',
        visibility: 'public',
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      }),
    )
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
    const path = `${folder}/${fileName}`

    await this.disk.put(path, file.buffer)

    return path
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.disk.delete(filePath)
  }

  getFileUrl(filePath?: string): string {
    if (!filePath) return null
    if (filePath.startsWith('http')) return filePath

    const cleanPath = filePath.replace(/^\//, '')

    const rawUrl =
      this.configService.get<string>('S3_CDN_URL') ||
      this.configService.get<string>('S3_URL') ||
      'http://84.247.148.122:9000'
    const publicUrl = rawUrl.replace(/\/+$/, '')
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'umbreon'

    if (publicUrl.endsWith(`/${bucketName}`)) {
      return `${publicUrl}/${cleanPath}`
    }

    return `${publicUrl}/${bucketName}/${cleanPath}`
  }
}
