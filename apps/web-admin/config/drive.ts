import { defineConfig, services } from '@adonisjs/drive'
import env from '#start/env'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK', 's3') as 's3',

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID') || env.get('S3_ACCESS_KEY_ID') || 'umbreon_minio',
        secretAccessKey:
          env.get('AWS_SECRET_ACCESS_KEY') ||
          env.get('S3_SECRET_ACCESS_KEY') ||
          'Umbr30n_M1n10_S3cur3_2026!',
      },
      region: env.get('AWS_REGION') || env.get('S3_REGION') || 'us-east-1',
      bucket: env.get('S3_BUCKET') || env.get('S3_BUCKET_NAME') || 'umbreon',
      visibility: 'public',
      endpoint: env.get('S3_ENDPOINT') || 'http://minio:9000',
      forcePathStyle: true,
    }),
    // r2: services.s3({
    //   credentials: {
    //     accessKeyId: env.get('R2_KEY'),
    //     secretAccessKey: env.get('R2_SECRET'),
    //   },
    //   region: 'auto',
    //   bucket: env.get('R2_BUCKET'),
    //   endpoint: env.get('R2_ENDPOINT'),
    //   visibility: 'public',
    // }),
    // spaces: services.s3({
    //   credentials: {
    //     accessKeyId: env.get('SPACES_KEY'),
    //     secretAccessKey: env.get('SPACES_SECRET'),
    //   },
    //   region: env.get('SPACES_REGION'),
    //   bucket: env.get('SPACES_BUCKET'),
    //   endpoint: env.get('SPACES_ENDPOINT'),
    //   visibility: 'public',
    // }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
