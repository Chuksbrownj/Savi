/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const server = express();
let cachedApp: express.Express | null = null;

async function bootstrap(appInstance: any) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(appInstance), { bufferLogs: true });

  // ── Pino structured logging ──────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── URI Versioning: /api/v1/... ──────────────────────────────────────────
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/metrics'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global Exception Filter ──────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global Response Interceptor ──────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── CORS (relax in production via env) ───────────────────────────────────
  app.enableCors();

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Savi — Laundry Management Platform API')
    .setDescription(
      'REST API for the Savi Laundry Management Platform. ' +
        'Serves Customer, Business Operator, Dispatch Rider, and Admin roles.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Customer', 'Customer-facing endpoints')
    .addTag('Business', 'Business Operator endpoints')
    .addTag('Dispatch', 'Dispatch Rider endpoints')
    .addTag('Admin', 'Admin / platform management endpoints')
    .addTag('Health', 'Health & observability endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();
  return app;
}

// ── Local Development Server ──────────────────────────────────────────────
// VERCEL injects various env vars, or we can look for NODE_ENV=development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap(server).then(async (app) => {
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`\n🚀 Savi API running at: http://localhost:${port}`);
    console.log(`📚 Swagger docs at:    http://localhost:${port}/api/docs`);
    console.log(`💚 Health check at:    http://localhost:${port}/health\n`);
  }).catch(console.error);
}

// ── Vercel Serverless Function ────────────────────────────────────────────
export default async (req: any, res: any) => {
  if (!cachedApp) {
    await bootstrap(server);
    cachedApp = server;
  }
  return cachedApp(req, res);
};
