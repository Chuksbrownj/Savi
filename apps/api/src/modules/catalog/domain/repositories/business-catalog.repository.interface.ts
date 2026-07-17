import { Business } from '@prisma/client';

export const BUSINESS_CATALOG_REPOSITORY = Symbol(
  'BUSINESS_CATALOG_REPOSITORY',
);

export interface IBusinessCatalogRepository {
  findAllActive(params?: {
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Business[]>;
  findById(id: string): Promise<Business | null>;
}
