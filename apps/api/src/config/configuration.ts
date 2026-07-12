import { registerAs } from '@nestjs/config';

/** Database configuration namespace */
export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));

/** Redis configuration namespace */
export const redisConfig = registerAs('redis', () => ({
  host: process.env['REDIS_HOST'] ?? 'localhost',
  port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
  password: process.env['REDIS_PASSWORD'],
}));

/** JWT configuration namespace */
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env['JWT_SECRET'],
  accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
  refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
}));

/** Storage configuration namespace */
export const storageConfig = registerAs('storage', () => ({
  provider: process.env['STORAGE_PROVIDER'] ?? 's3',
  aws: {
    region: process.env['AWS_REGION'],
    bucket: process.env['AWS_S3_BUCKET'],
  },
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
    apiKey: process.env['CLOUDINARY_API_KEY'],
    apiSecret: process.env['CLOUDINARY_API_SECRET'],
  },
}));

/** Payments configuration namespace */
export const paymentsConfig = registerAs('payments', () => ({
  paystack: { secretKey: process.env['PAYSTACK_SECRET_KEY'] },
  flutterwave: { secretKey: process.env['FLUTTERWAVE_SECRET_KEY'] },
  stripe: { secretKey: process.env['STRIPE_SECRET_KEY'] },
}));

/** Notifications configuration namespace */
export const notificationsConfig = registerAs('notifications', () => ({
  fcm: {
    projectId: process.env['FCM_PROJECT_ID'],
    clientEmail: process.env['FCM_CLIENT_EMAIL'],
    privateKey: process.env['FCM_PRIVATE_KEY'],
  },
  email: { sendgridApiKey: process.env['SENDGRID_API_KEY'] },
  sms: { termiiApiKey: process.env['TERMII_API_KEY'] },
}));

/** Maps configuration namespace */
export const mapsConfig = registerAs('maps', () => ({
  googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'],
}));

/** Throttler configuration namespace */
export const throttlerConfig = registerAs('throttler', () => ({
  ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60', 10),
  limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
}));
