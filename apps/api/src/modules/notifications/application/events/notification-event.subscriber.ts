import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { NotificationChannel } from '@prisma/client';
import { QStashService } from '../../../../infrastructure/qstash/qstash.service';

@Injectable()
export class NotificationEventSubscriber {
  private readonly logger = new Logger(NotificationEventSubscriber.name);

  constructor(
    private readonly qstashService: QStashService,
    private readonly prisma: PrismaService,
  ) {}

  private async dispatchNotification(userId: string, category: string, title: string, body: string, defaultChannels: NotificationChannel[], data?: Record<string, string>) {
    // Check preferences
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId, category },
    });

    const optedOutChannels = new Set(
      preferences.filter(p => p.isOptedOut).map(p => p.channel)
    );

    const channelsToUse = defaultChannels.filter(c => !optedOutChannels.has(c));

    if (channelsToUse.length === 0) {
      this.logger.debug(`User ${userId} opted out of all channels for category ${category}`);
      return;
    }

    await this.qstashService.publishWebhook('/api/v1/notifications/webhooks/qstash', {
      userId,
      category,
      channels: channelsToUse,
      title,
      body,
      data,
    });
  }

  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(payload: { userId: string; orderId: string; status: string }) {
    await this.dispatchNotification(
      payload.userId,
      'OrderUpdates',
      'Order Status Update',
      `Your order ${payload.orderId} status has changed to ${payload.status}.`,
      [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
      { orderId: payload.orderId, status: payload.status }
    );
  }

  @OnEvent('dispatch.task_assigned')
  async handleDispatchTaskAssigned(payload: { driverId: string; orderId: string }) {
    await this.dispatchNotification(
      payload.driverId,
      'Dispatch',
      'New Delivery Assigned',
      `You have been assigned a new delivery for order ${payload.orderId}.`,
      [NotificationChannel.Push, NotificationChannel.InApp],
      { orderId: payload.orderId }
    );
  }

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmed(payload: { userId: string; paymentId: string; amount: number }) {
    await this.dispatchNotification(
      payload.userId,
      'Payments',
      'Payment Confirmed',
      `Your payment of ${payload.amount} has been confirmed (Ref: ${payload.paymentId}).`,
      [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
      { paymentId: payload.paymentId }
    );
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(payload: { userId: string; paymentId: string; amount: number }) {
    await this.dispatchNotification(
      payload.userId,
      'Payments',
      'Payment Failed',
      `Your payment of ${payload.amount} failed (Ref: ${payload.paymentId}). Please try again.`,
      [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
      { paymentId: payload.paymentId }
    );
  }

  @OnEvent('settlement.processed')
  async handleSettlementProcessed(payload: { businessId: string; settlementId: string; amount: number }) {
    // Need to find business owner userId
    const business = await this.prisma.business.findUnique({ where: { id: payload.businessId } });
    if (business) {
      await this.dispatchNotification(
        business.ownerUserId,
        'Settlements',
        'Settlement Processed',
        `A settlement of ${payload.amount} has been processed for your business.`,
        [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
        { settlementId: payload.settlementId, businessId: payload.businessId }
      );
    }
  }

  @OnEvent('support.ticket_created')
  async handleSupportTicketCreated(payload: { userId: string; ticketId: string }) {
    await this.dispatchNotification(
      payload.userId,
      'Support',
      'Support Ticket Created',
      `Your support ticket ${payload.ticketId} has been created and our team will review it shortly.`,
      [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
      { ticketId: payload.ticketId }
    );
  }

  @OnEvent('support.ticket_resolved')
  async handleSupportTicketResolved(payload: { userId: string; ticketId: string }) {
    await this.dispatchNotification(
      payload.userId,
      'Support',
      'Support Ticket Resolved',
      `Your support ticket ${payload.ticketId} has been marked as resolved.`,
      [NotificationChannel.Push, NotificationChannel.InApp, NotificationChannel.Email],
      { ticketId: payload.ticketId }
    );
  }
}
