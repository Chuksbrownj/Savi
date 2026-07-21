import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app/app.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Business Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let businessToken: string;
  let businessId: string;
  let branchId: string;
  let orderId: string;
  let riderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup Test Data
    const ownerUser = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        passwordHash: 'hash',
        userType: 'BusinessOwner',
        isActive: true,
      },
    });

    const business = await prisma.business.create({
      data: { name: 'Test Business', registrationNumber: '123', ownerUserId: ownerUser.id },
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

    const role = await prisma.role.create({
      data: { name: 'Admin' },
    });

    // Add permission for orders
    const permRead = await prisma.permission.create({
      data: { code: 'orders:read', module: 'Order' },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permRead.id },
    });
    const permApprove = await prisma.permission.create({
      data: { code: 'orders:approve', module: 'Order' },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permApprove.id },
    });

    const user = await prisma.user.create({
      data: {
        email: 'biz-admin@test.com',
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

    const customerUser = await prisma.user.create({
      data: {
        email: 'cust@test.com',
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
        businessId,
        customerId: customer.id,
        branchId,
        status: 'PaymentConfirmed',
        orderNumber: 'ORD-' + Date.now(),
        pickupAddressId: address.id,
        deliveryAddressId: address.id,
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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.staffProfile.deleteMany({ where: { businessId } });
    await prisma.order.deleteMany({ where: { businessId } });
    await prisma.branch.deleteMany({ where: { businessId } });
    await prisma.business.deleteMany({ where: { id: businessId } });
    await prisma.role.deleteMany({ where: { name: { in: ['Admin', 'Dummy'] } } });
    await prisma.user.deleteMany({
      where: { email: { in: ['owner@test.com', 'biz-admin@test.com', 'cust@test.com'] } },
    });
    await app.close();
  });

  it('/api/v1/business/orders (GET) - lists orders', () => {
    return request(app.getHttpServer())
      .get('/api/v1/business/orders')
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200)
      .expect((res: any) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.total).toBe(1);
        expect(res.body.data[0].id).toEqual(orderId);
      });
  });

  it('/api/v1/business/orders/:id/approve (POST) - approves order', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/business/orders/${orderId}/approve`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(201)
      .expect((res: any) => {
        expect(res.body.status).toEqual('AwaitingPickupAssignment');
      });
  });

  it('/api/v1/business/orders/:id/approve (POST) - negative: no permission', async () => {
    // Generate token with a role that has no permissions
    const dummyRole = await prisma.role.create({
      data: { name: 'Dummy' },
    });
    const token = jwtService.sign({
      sub: 'user',
      userType: 'BusinessOwner',
      businessId,
      roleId: dummyRole.id,
    });

    return request(app.getHttpServer())
      .post(`/api/v1/business/orders/${orderId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
