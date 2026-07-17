import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../identity/interface/decorators/public.decorator';

import { ListBusinessesUseCase } from '../../application/use-cases/list-businesses.use-case';
import { ListBusinessServicesUseCase } from '../../application/use-cases/list-business-services.use-case';
import {
  ListBusinessesQueryDto,
  ListServicesQueryDto,
} from '../../application/dtos/catalog.dto';

@ApiTags('Catalog')
@Controller('api/v1/businesses')
export class CatalogController {
  constructor(
    private readonly listBusinesses: ListBusinessesUseCase,
    private readonly listServices: ListBusinessServicesUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active businesses' })
  async getBusinesses(@Query() query: ListBusinessesQueryDto) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset, 10) : undefined;
    return this.listBusinesses.execute({
      city: query.city,
      search: query.search,
      limit,
      offset,
    });
  }

  @Public()
  @Get(':id/services')
  @ApiOperation({ summary: 'List active services for a business' })
  async getBusinessServices(
    @Param('id') id: string,
    @Query() query: ListServicesQueryDto,
  ) {
    return this.listServices.execute(id, { serviceType: query.serviceType });
  }
}
