import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType, DispatchTaskStatus } from '@prisma/client';
import { CurrentUser } from '../../../identity/interface/decorators/current-user.decorator';

import { UpdateAvailabilityDto } from '../dtos/update-availability.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { RejectJobDto } from '../dtos/reject-job.dto';
import { ConfirmJobDto } from '../dtos/confirm-job.dto';
import { ReportIssueDto } from '../dtos/report-issue.dto';

import { UpdateRiderAvailabilityUseCase } from '../../application/use-cases/update-rider-availability.use-case';
import { UpdateRiderLocationUseCase } from '../../application/use-cases/update-rider-location.use-case';
import { GetRiderJobsUseCase } from '../../application/use-cases/get-rider-jobs.use-case';
import { AcceptRejectJobUseCase } from '../../application/use-cases/accept-reject-job.use-case';
import { StartJobUseCase } from '../../application/use-cases/start-job.use-case';
import { ConfirmJobUseCase } from '../../application/use-cases/confirm-job.use-case';
import { ReportIssueUseCase } from '../../application/use-cases/report-issue.use-case';
import { GetRiderEarningsUseCase } from '../../application/use-cases/get-rider-earnings.use-case';

@ApiTags('Dispatch')
@ApiBearerAuth('access-token')
@Roles(UserType.DispatchRider)
@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly updateRiderAvailability: UpdateRiderAvailabilityUseCase,
    private readonly updateRiderLocation: UpdateRiderLocationUseCase,
    private readonly getRiderJobs: GetRiderJobsUseCase,
    private readonly acceptRejectJob: AcceptRejectJobUseCase,
    private readonly startJob: StartJobUseCase,
    private readonly confirmJob: ConfirmJobUseCase,
    private readonly reportIssue: ReportIssueUseCase,
    private readonly getRiderEarnings: GetRiderEarningsUseCase,
  ) {}

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle rider availability (Online/Offline)' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  @ApiResponse({ status: 409, description: 'Cannot go offline while on a job' })
  async updateAvailability(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.updateRiderAvailability.execute(userId, dto.status);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Update rider current location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.updateRiderLocation.execute(userId, dto.lat, dto.lng);
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'List assigned jobs, optionally filtered by status',
  })
  @ApiQuery({
    name: 'status',
    enum: DispatchTaskStatus,
    isArray: true,
    required: false,
  })
  async getJobs(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: DispatchTaskStatus[],
  ) {
    // Ensuring it's an array if passed as a single string in query
    const statusArray = status
      ? Array.isArray(status)
        ? status
        : [status]
      : undefined;
    return this.getRiderJobs.execute(userId, statusArray);
  }

  @Get('jobs/history')
  @ApiOperation({ summary: 'View job history (Completed tasks)' })
  async getJobHistory(@CurrentUser('sub') userId: string) {
    return this.getRiderJobs.execute(userId, [DispatchTaskStatus.Completed]);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get full details of a specific job' })
  async getJobById(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.getRiderJobs.getById(userId, taskId);
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept an assigned job' })
  async acceptJob(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.acceptRejectJob.accept(userId, taskId);
  }

  @Post('jobs/:id/reject')
  @ApiOperation({ summary: 'Reject an assigned job (requires reason)' })
  async rejectJob(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
    @Body() dto: RejectJobDto,
  ) {
    return this.acceptRejectJob.reject(userId, taskId, dto.reason);
  }

  @Post('jobs/:id/start')
  @ApiOperation({ summary: 'Start a job (transitions order status)' })
  async startTask(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
  ) {
    return this.startJob.execute(userId, taskId);
  }

  @Post('jobs/:id/confirm-pickup')
  @ApiOperation({ summary: 'Confirm pickup (requires photo proof)' })
  async confirmPickup(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
    @Body() dto: ConfirmJobDto,
  ) {
    return this.confirmJob.execute(userId, taskId, dto);
  }

  @Post('jobs/:id/confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery (requires photo proof)' })
  async confirmDelivery(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
    @Body() dto: ConfirmJobDto,
  ) {
    return this.confirmJob.execute(userId, taskId, dto);
  }

  @Post('jobs/:id/report-issue')
  @ApiOperation({ summary: 'Report an issue with the job' })
  async reportTaskIssue(
    @CurrentUser('sub') userId: string,
    @Param('id') taskId: string,
    @Body() dto: ReportIssueDto,
  ) {
    return this.reportIssue.execute(userId, taskId, dto.description);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'View earnings and settlements' })
  async getEarnings(@CurrentUser('sub') userId: string) {
    return this.getRiderEarnings.execute(userId);
  }
}
