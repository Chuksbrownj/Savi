import { PrismaClient, UserType } from '@prisma/client';
import * as argon2 from 'argon2';
import * as readline from 'readline';

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('--- Savi Platform SuperAdmin Seeder ---');
  
  const email = await prompt('Enter Admin Email [admin@saviapp.com]: ') || 'admin@saviapp.com';
  const fullName = await prompt('Enter Admin Full Name [System Admin]: ') || 'System Admin';
  const password = await prompt('Enter Admin Password: ');

  if (!password) {
    console.error('Error: Password cannot be empty.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    console.error(`Error: User with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const admin = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      userType: UserType.Admin,
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log(`\nSuccess! SuperAdmin created with ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
