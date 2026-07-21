import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { Role } from '@prisma/client';

async function bootstrap() {
  console.log('Starting NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const eventEmitter = app.get(EventEmitter2);
  const prisma = app.get(PrismaService);
  
  console.log('Creating mock user & business...');
  const testEmail = `test-notification-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      fullName: 'Test User',
      passwordHash: 'dummy',
      userType: 'BusinessOwner',
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerUserId: user.id,
      name: 'Test Business',
      isActive: true
    }
  });

  console.log(`Mock user created with ID: ${user.id}`);
  console.log(`Mock business created with ID: ${business.id}`);

  // Need to make sure queue is ready. Wait a tiny bit.
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Emitting payment.confirmed event...');
  eventEmitter.emit('payment.confirmed', {
    paymentId: 'dummy-payment-id',
    businessId: business.id,
    userId: user.id,
    amount: 1500,
    currency: 'USD'
  });

  console.log('Waiting 5s for BullMQ worker to process the event...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Checking database for stored In-App notifications...');
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id }
  });

  console.log(`Found ${notifications.length} notifications!`);
  for (const n of notifications) {
    console.log(`- [${n.channel}] ${n.title}: ${n.body}`);
  }

  // Cleanup
  console.log('Cleaning up mock data...');
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
  await prisma.business.delete({ where: { id: business.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('Test complete!');
  await app.close();
  process.exit(notifications.length > 0 ? 0 : 1);
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
