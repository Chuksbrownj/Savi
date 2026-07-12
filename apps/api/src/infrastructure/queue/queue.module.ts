import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * QueueModule — Global BullMQ connection backed by Redis.
 * Later phases will register specific queues (notifications, settlements, etc.)
 * by importing BullModule.registerQueue() in their respective modules.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string | undefined>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
