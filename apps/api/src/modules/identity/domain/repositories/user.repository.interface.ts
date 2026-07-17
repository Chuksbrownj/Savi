import { User, UserType } from '@prisma/client';

export type CreateUserData = {
  email?: string;
  phone?: string;
  passwordHash: string;
  userType: UserType;
};

export type UpdateUserData = Partial<
  Pick<
    User,
    | 'isEmailVerified'
    | 'isPhoneVerified'
    | 'passwordHash'
    | 'lastLoginAt'
    | 'isActive'
  >
>;

/**
 * IUserRepository — domain repository interface for the User aggregate.
 * Implementations live in the infrastructure layer.
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
