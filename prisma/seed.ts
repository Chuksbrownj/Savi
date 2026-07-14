import { PrismaClient, UserType } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://savi_user:savi_password@localhost:5432/savi_dev',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 1. Roles & Permissions
  const permissions = [
    { code: 'orders:view', description: 'View orders', module: 'orders' },
    { code: 'orders:edit', description: 'Edit orders', module: 'orders' },
    { code: 'orders:approve', description: 'Approve orders', module: 'orders' },
    {
      code: 'orders:assign_dispatch',
      description: 'Assign riders to orders',
      module: 'orders',
    },
    {
      code: 'pricing:manage',
      description: 'Manage pricing',
      module: 'pricing',
    },
    {
      code: 'dispatch:accept',
      description: 'Accept dispatch task',
      module: 'dispatch',
    },
    {
      code: 'dispatch:update_status',
      description: 'Update dispatch status',
      module: 'dispatch',
    },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      }),
    ),
  );

  const rolesData = [
    {
      name: 'SuperAdmin',
      isSystemRole: true,
      permissions: createdPermissions.map((p) => p.id), // All permissions
    },
    {
      name: 'BusinessOwner',
      isSystemRole: true,
      permissions: createdPermissions
        .filter(
          (p) =>
            p.code !== 'dispatch:accept' && p.code !== 'dispatch:update_status',
        )
        .map((p) => p.id),
    },
    {
      name: 'Staff',
      isSystemRole: true,
      permissions: createdPermissions
        .filter((p) => ['orders:view', 'orders:edit'].includes(p.code))
        .map((p) => p.id),
    },
    {
      name: 'DispatchRider',
      isSystemRole: true,
      permissions: createdPermissions
        .filter((p) =>
          ['dispatch:accept', 'dispatch:update_status'].includes(p.code),
        )
        .map((p) => p.id), // Specifically NO orders:assign_dispatch or orders:edit
    },
    {
      name: 'Customer',
      isSystemRole: true,
      permissions: [], // Customers typically don't use RBAC permissions, they are scoped by userId
    },
  ];

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        isSystemRole: r.isSystemRole,
        permissions: {
          create: r.permissions.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
    });
    console.log(`Created Role: ${role.name}`);
  }

  const businessOwnerRole = await prisma.role.findUnique({
    where: { name: 'BusinessOwner' },
  });
  const staffRole = await prisma.role.findUnique({ where: { name: 'Staff' } });
  const riderRole = await prisma.role.findUnique({
    where: { name: 'DispatchRider' },
  });

  // 2. Users & Profiles
  // Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@savi.app' },
    update: {},
    create: {
      email: 'owner@savi.app',
      passwordHash: 'dummy_hash', // In real app, this should be a proper bcrypt/argon2 hash
      userType: UserType.BusinessOwner,
      isEmailVerified: true,
    },
  });

  // Business & Branch
  const business = await prisma.business.create({
    data: {
      name: 'Savi Laundry Hub',
      ownerUserId: owner.id,
      supportEmail: 'support@savi.app',
    },
  });

  const branchAddress = await prisma.address.create({
    data: {
      line1: '123 Business St',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: 'Lagos Island Branch',
      addressId: branchAddress.id,
      phone: '08000000001',
    },
  });

  // Staff
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@savi.app' },
    update: {},
    create: {
      email: 'staff@savi.app',
      passwordHash: 'dummy_hash',
      userType: UserType.Staff,
      isEmailVerified: true,
    },
  });

  await prisma.staffProfile.create({
    data: {
      userId: staffUser.id,
      businessId: business.id,
      branchId: branch.id,
      roleId: staffRole!.id,
    },
  });

  // Rider
  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@savi.app' },
    update: {},
    create: {
      email: 'rider@savi.app',
      passwordHash: 'dummy_hash',
      userType: UserType.DispatchRider,
      isEmailVerified: true,
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: { type: 'Bike', plateNumber: 'LAG-123-AA' },
  });

  const riderProfile = await prisma.dispatchRiderProfile.create({
    data: {
      userId: riderUser.id,
      businessId: business.id,
      vehicleId: vehicle.id,
    },
  });

  // Customer
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: 'dummy_hash',
      userType: UserType.Customer,
      isEmailVerified: true,
    },
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      line1: '456 Customer Ave',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      isDefault: true,
    },
  });

  await prisma.customerProfile.create({
    data: {
      userId: customerUser.id,
      defaultAddressId: customerAddress.id,
    },
  });

  // 3. Laundry Services & Pricing
  const services = [
    {
      name: 'WashAndIron',
      description: 'Washing and ironing service',
      unit: 'PerItem',
      price: 500,
    },
    {
      name: 'DryCleaning',
      description: 'Professional dry cleaning',
      unit: 'PerItem',
      price: 1500,
    },
    {
      name: 'WashOnly',
      description: 'Wash and fold',
      unit: 'PerKg',
      price: 1000,
    },
  ];

  for (const s of services) {
    const service = await prisma.laundryService.create({
      data: {
        businessId: business.id,
        name: s.name,
        description: s.description,
      },
    });

    await prisma.pricing.create({
      data: {
        businessId: business.id,
        laundryServiceId: service.id,
        unit: s.unit,
        basePrice: s.price,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
