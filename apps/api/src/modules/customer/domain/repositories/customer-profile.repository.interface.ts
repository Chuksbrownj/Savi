import { CustomerProfile, User } from '@prisma/client';

export type CustomerProfileWithUser = CustomerProfile & { user: User };

export const CUSTOMER_PROFILE_REPOSITORY = Symbol(
  'CUSTOMER_PROFILE_REPOSITORY',
);

export interface ICustomerProfileRepository {
  findByUserId(userId: string): Promise<CustomerProfileWithUser | null>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  updateProfile(
    id: string,
    data: Partial<CustomerProfile>,
  ): Promise<CustomerProfile>;
}
