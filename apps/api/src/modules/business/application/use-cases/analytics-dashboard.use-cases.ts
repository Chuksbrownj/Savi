import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AnalyticsDashboardUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(businessId: string, period: 'today' | 'week' | 'month') {
    const startDate = this.getStartDate(period);

    const [totalOrders, activeOrders, revenueResult, cancelledOrders, completedOrders] = await Promise.all([
      this.prisma.order.count({
        where: { businessId, createdAt: { gte: startDate } },
      }),
      this.prisma.order.count({
        where: { businessId, status: { notIn: ['Completed', 'Cancelled', 'Delivered'] } },
      }),
      this.prisma.order.aggregate({
        where: { businessId, createdAt: { gte: startDate }, status: { notIn: ['Cancelled'] } },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.order.count({
        where: { businessId, status: 'Cancelled', createdAt: { gte: startDate } },
      }),
      this.prisma.order.count({
        where: { businessId, status: 'Completed', createdAt: { gte: startDate } },
      })
    ]);

    const revenue = revenueResult._sum.total || 0;
    const averageOrderValue = revenueResult._avg.total || 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      activeOrders,
      revenue,
      averageOrderValue,
      completionRate,
      cancellationRate,
    };
  }

  async getOrdersTrend(businessId: string, period: 'day' | 'week' | 'month', branchId?: string) {
    // Basic implementation - in production, this would use a raw query with date_trunc for proper grouping
    // This is simplified to just returning the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days

    const where: any = {
      businessId,
      createdAt: { gte: startDate },
    };
    if (branchId) where.branchId = branchId;

    const orders = await this.prisma.order.findMany({
      where,
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    // Grouping logic in memory (suitable for small datasets, but should be SQL date_trunc for large)
    const trends: Record<string, { count: number; revenue: number }> = {};
    
    orders.forEach(o => {
      const dateKey = o.createdAt.toISOString().split('T')[0];
      if (!trends[dateKey]) {
        trends[dateKey] = { count: 0, revenue: 0 };
      }
      trends[dateKey].count++;
      trends[dateKey].revenue += Number(o.total);
    });

    return Object.keys(trends).map(date => ({
      date,
      ...trends[date]
    }));
  }

  async getServiceBreakdown(businessId: string) {
    // This requires joining orderItems and LaundryService.
    const items = await this.prisma.orderItem.findMany({
      where: { order: { businessId } },
      include: { laundryService: true },
    });

    const breakdown: Record<string, { count: number; revenue: number }> = {};

    items.forEach(item => {
      const serviceName = item.laundryService.name;
      if (!breakdown[serviceName]) {
        breakdown[serviceName] = { count: 0, revenue: 0 };
      }
      breakdown[serviceName].count += item.quantity;
      breakdown[serviceName].revenue += Number(item.lineTotal);
    });

    return Object.keys(breakdown).map(service => ({
      service,
      ...breakdown[service]
    }));
  }

  async getRiderPerformance(businessId: string) {
    const riders = await this.prisma.dispatchRiderProfile.findMany({
      where: { businessId },
      include: {
        dispatchTasks: {
          where: { status: 'Completed' },
          select: { id: true }
        },
        user: {
          select: { fullName: true }
        }
      }
    });

    return riders.map(r => ({
      riderId: r.id,
      name: r.user.fullName,
      rating: r.rating,
      totalDeliveries: r.dispatchTasks.length,
    }));
  }

  async getBranchPerformance(businessId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { businessId },
      include: {
        orders: {
          select: { id: true, total: true }
        }
      }
    });

    return branches.map(b => ({
      branchId: b.id,
      name: b.name,
      totalOrders: b.orders.length,
      revenue: b.orders.reduce((sum, o) => sum + Number(o.total), 0),
    }));
  }

  async getCustomerInsights(businessId: string) {
    const customers = await this.prisma.customerProfile.findMany({
      where: {
        orders: { some: { businessId } }
      },
      include: {
        orders: {
          where: { businessId },
          select: { id: true, total: true }
        },
        user: { select: { fullName: true, email: true } }
      }
    });

    let repeatCustomers = 0;
    const topCustomers = customers
      .map(c => {
        if (c.orders.length > 1) repeatCustomers++;
        return {
          customerId: c.id,
          name: c.user.fullName,
          email: c.user.email,
          orderCount: c.orders.length,
          lifetimeValue: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
        };
      })
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10); // Top 10

    return {
      totalCustomers: customers.length,
      repeatCustomerRate: customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0,
      topCustomers,
    };
  }

  private getStartDate(period: 'today' | 'week' | 'month'): Date {
    const now = new Date();
    if (period === 'today') {
      now.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      now.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      now.setMonth(now.getMonth() - 1);
    }
    return now;
  }
}
