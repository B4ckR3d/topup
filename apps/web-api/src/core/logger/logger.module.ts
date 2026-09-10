import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'

const isProduction = process.env.NODE_ENV === 'production'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        autoLogging: true,
        genReqId: (request) => request.headers['x-request-id']?.toString(),
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
          remove: true,
        },
        customProps: () => ({
          app: 'web-api',
          env: process.env.NODE_ENV || 'development',
        }),
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
      },
    }),
  ],
})
export class AppLoggerModule {}
