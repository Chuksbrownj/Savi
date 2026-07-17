import { Inject, Injectable } from '@nestjs/common';
import {
  BUSINESS_CATALOG_REPOSITORY,
  IBusinessCatalogRepository,
} from '../../domain/repositories/business-catalog.repository.interface';
import { Business } from '@prisma/client';

@Injectable()
export class ListBusinessesUseCase {
  constructor(
    @Inject(BUSINESS_CATALOG_REPOSITORY)
    private readonly businessRepo: IBusinessCatalogRepository,
  ) {}

  async execute(params?: {
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Business[]> {
    return this.businessRepo.findAllActive(params);
  }
}
