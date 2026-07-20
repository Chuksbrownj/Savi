import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { DispatchTaskStatus } from '@prisma/client';

describe('Dispatch Rider Module End-to-End Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let businessToken: string;
  let riderToken: string;

  let businessId: string;
  let branchId: string;
  let orderId: string;
  let riderId: string;
  let taskId: string;

  const testId = Date.now().toString();
  const ownerEmail = `owner-${testId}@test.com`;
  const bizEmail = `biz-${testId}@test.com`;
  const custEmail = `cust-${testId}@test.com`;
  const riderEmail = `rider-${testId}@test.com`;
  const roleName = `Admin_Dispatch_Test`;
  const permissionCode = `orders:assign_dispatch`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Cleanup previous runs if any
    try {
      await prisma.proofOfDelivery.deleteMany();
      await prisma.dispatchTask.deleteMany();
      await prisma.order.deleteMany();
      await prisma.dispatchRiderProfile.deleteMany();
      await prisma.staffProfile.deleteMany();
      await prisma.branch.deleteMany();
      await prisma.rolePermission.deleteMany();
    } catch (_e) {
      // Ignore cleanup errors
    }

    // 0. Setup Test Data (Owner)
    const ownerUser = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash: 'hash',
        userType: 'BusinessOwner',
        isActive: true,
      },
    });

    // 1. Setup Test Data (Business)
    const business = await prisma.business.create({
      data: {
        name: 'Test Business Dispatch',
        registrationNumber: '12345',
        ownerUserId: ownerUser.id,
      },
    });
    businessId = business.id;

    const address = await prisma.address.create({
      data: {
        line1: '123 Test St',
        city: 'Test',
        state: 'Test',
        country: 'Test',
      },
    });

    const branch = await prisma.branch.create({
      data: { businessId, name: 'Main Branch', addressId: address.id },
    });
    branchId = branch.id;

    let role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleName } });
    }

    // Create permission and map it
    let permission = await prisma.permission.findFirst({
      where: { code: permissionCode },
    });
    if (!permission) {
      permission = await prisma.permission.create({
        data: { code: permissionCode, module: 'Dispatch' },
      });
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: permission.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });

    const user = await prisma.user.create({
      data: {
        email: bizEmail,
        passwordHash: 'hash',
        userType: 'BusinessOwner',
        isActive: true,
      },
    });

    await prisma.staffProfile.create({
      data: { userId: user.id, businessId, branchId, roleId: role.id },
    });

    businessToken = jwtService.sign({
      sub: user.id,
      userType: 'BusinessOwner',
      businessId,
      branchId,
      roleId: role.id,
    });

    // 2. Setup Test Data (Customer & Order - simulating Phase 4)
    const customerUser = await prisma.user.create({
      data: {
        email: custEmail,
        passwordHash: 'hash',
        userType: 'Customer',
        isActive: true,
      },
    });
    const customer = await prisma.customerProfile.create({
      data: { userId: customerUser.id },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${testId}`,
        businessId,
        customerId: customer.id,
        branchId,
        pickupAddressId: address.id,
        deliveryAddressId: address.id,
        status: 'AwaitingPickupAssignment',
        subtotal: 1000,
        deliveryFee: 0,
        total: 1000,
        paymentMethod: 'Full',
        paymentStatus: 'Paid',
        scheduledPickupAt: new Date(),
        scheduledDeliveryAt: new Date(),
      },
    });
    orderId = order.id;

    // 3. Setup Test Data (Dispatch Rider)
    const riderUser = await prisma.user.create({
      data: {
        email: riderEmail,
        passwordHash: 'hash',
        userType: 'DispatchRider',
        isActive: true,
      },
    });

    const rider = await prisma.dispatchRiderProfile.create({
      data: {
        userId: riderUser.id,
        businessId,
        availability: 'Online',
      },
    });
    riderId = rider.id;

    riderToken = jwtService.sign({
      sub: riderUser.id,
      userType: 'DispatchRider',
      businessId,
      branchId,
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await prisma.proofOfDelivery.deleteMany();
      await prisma.dispatchTask.deleteMany({ where: { businessId } });
      await prisma.order.deleteMany({ where: { businessId } });
      await prisma.dispatchRiderProfile.deleteMany({ where: { businessId } });
      await prisma.staffProfile.deleteMany({ where: { businessId } });
      await prisma.branch.deleteMany({ where: { businessId } });
      await prisma.business.deleteMany({ where: { id: businessId } });
      await prisma.rolePermission.deleteMany({
        where: { role: { name: roleName } },
      });
      // Keep role and permission to avoid test conflicts, just remove the mapping
      await prisma.user.deleteMany({
        where: { email: { in: [ownerEmail, bizEmail, custEmail, riderEmail] } },
      });
    } catch (e) {
      console.warn('Cleanup skipped/failed due to constraints', e);
    }
    await app.close();
  });

  describe('End-to-End Assignment and Completion Flow', () => {
    it('Phase 5: Business assigns rider to the order (Auto/Manual)', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .post(
          `/api/v1/business/dispatch-tasks/orders/${orderId}/assign-pickup-rider`,
        )
        .set('Authorization', `Bearer ${businessToken}`)
        .send({
          riderId, // explicit assignment for this test
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe(DispatchTaskStatus.Assigned);
      expect(res.body.riderId).toBe(riderId);

      taskId = res.body.id;
    });

    it('Phase 6: Rider accepts the assigned job', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .post(`/api/v1/dispatch/jobs/${taskId}/accept`)
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(201);

      expect(res.body.status).toBe(DispatchTaskStatus.Accepted);
    });

    it('Phase 6: Rider starts the job (moves to in-progress)', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .post(`/api/v1/dispatch/jobs/${taskId}/start`)
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(201);

      expect(res.body.status).toBe(DispatchTaskStatus.InProgress);

      // Verify order status is PickupInProgress
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe('PickupInProgress');
    });

    it('Phase 6: Rider confirms the pickup', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .post(`/api/v1/dispatch/jobs/${taskId}/confirm-pickup`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          imageUrl: 'https://example.com/proof.jpg',
          notes: 'Picked up successfully',
        })
        .expect(201);

      expect(res.body.status).toBe(DispatchTaskStatus.Completed);

      // Verify order status is LaundryReceived
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe('LaundryReceived');

      // Verify Proof of Delivery was created
      const pod = await prisma.proofOfDelivery.findUnique({
        where: { dispatchTaskId: taskId },
      });
      expect(pod).toBeTruthy();
      expect(pod?.imageUrl).toBe('https://example.com/proof.jpg');
    });

    it('Phase 6: Rider should now be available for next job', async () => {
      const riderProfile = await prisma.dispatchRiderProfile.findUnique({
        where: { id: riderId },
      });
      expect(riderProfile?.availability).toBe('Online');
    });
  });
});
