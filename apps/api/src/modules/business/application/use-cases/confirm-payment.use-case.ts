import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  UserType,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(
    businessId: string,
    orderId: string,
    amount: number,
    reference?: string,
  ) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.Paid) {
      throw new BadRequestException('Order is already fully paid');
    }

    let updated = await this.prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          orderId,
          amount,
          currency: 'NGN', // Should be dynamic based on settings ideally
          provider: 'MANUAL',
          method: PaymentMethod.PayOnDelivery,
          status: PaymentStatus.Paid,
          providerReference: reference || `MANUAL-${Date.now()}`,
          paidAt: new Date(),
        },
      });

      // Calculate total paid so far
      const allPayments = await tx.payment.findMany({
        where: { orderId, status: PaymentStatus.Paid },
      });
      const totalPaid = allPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      let newPaymentStatus = order.paymentStatus;
      if (totalPaid >= Number(order.total)) {
        newPaymentStatus = PaymentStatus.Paid;
      } else if (totalPaid > 0) {
        newPaymentStatus = PaymentStatus.PartiallyPaid;
      }
      let updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      return updatedOrder;
    });

    if (
      updated.paymentStatus === PaymentStatus.Paid &&
      order.status === OrderStatus.AwaitingPayment
    ) {
      updated = await this.workflowService.transition(
        updated as any,
        OrderStatus.PaymentConfirmed,
        UserType.BusinessOwner,
        {
          notes: 'Payment confirmed manually by business operator',
          actorUserId: businessId,
        },
      );
    }

    return updated;
  }
}
