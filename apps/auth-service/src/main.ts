// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Mental Health Auth Service')
    .setDescription('Authentication service for mental health platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Auth service running on port ${port}`);
}

bootstrap();

// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { ThrottlerStorageRedisService } from './throttler/throttler-storage-redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [ThrottlerStorageRedisService],
      useFactory: (throttlerStorage: ThrottlerStorageRedisService) => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: 10, // 10 requests per minute
          },
        ],
        storage: throttlerStorage,
      }),
    }),
    DatabaseModule,
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        },
      }),
    }),
    AuthModule,
  ],
})
export class AppModule {}
