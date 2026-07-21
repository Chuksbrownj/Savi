import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { NotificationChannel } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Device Tokens ───────────────────────────────────────────────────

  @Post('device-tokens')
  async registerDeviceToken(@Req() req: any, @Body() body: { token: string; deviceOs?: string }) {
    const userId = req.user.sub;
    
    // Upsert or create token
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: body.token }
    });

    if (existing) {
      if (existing.userId !== userId) {
        // Token was reassigned to a different user
        return this.prisma.deviceToken.update({
          where: { token: body.token },
          data: { userId, deviceOs: body.deviceOs }
        });
      }
      return existing;
    }

    return this.prisma.deviceToken.create({
      data: {
        userId,
        token: body.token,
        deviceOs: body.deviceOs,
      }
    });
  }

  // ── Preferences ─────────────────────────────────────────────────────

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return this.prisma.notificationPreference.findMany({
      where: { userId: req.user.sub }
    });
  }

  @Patch('preferences')
  async updatePreference(
    @Req() req: any,
    @Body() body: { category: string; channel: NotificationChannel; isOptedOut: boolean }
  ) {
    const userId = req.user.sub;

    return this.prisma.notificationPreference.upsert({
      where: {
        userId_category_channel: {
          userId,
          category: body.category,
          channel: body.channel,
        }
      },
      update: {
        isOptedOut: body.isOptedOut
      },
      create: {
        userId,
        category: body.category,
        channel: body.channel,
        isOptedOut: body.isOptedOut
      }
    });
  }

  // ── In-App Notifications ─────────────────────────────────────────────

  @Get()
  async getNotifications(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.sub, channel: NotificationChannel.InApp },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId: req.user.sub },
      data: { isRead: true }
    });
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.prisma.notification.updateMany({
      where: { userId: req.user.sub, isRead: false, channel: NotificationChannel.InApp },
      data: { isRead: true }
    });
  }
}
