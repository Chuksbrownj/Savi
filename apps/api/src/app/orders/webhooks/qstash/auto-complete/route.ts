import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // In production, verify the QStash signature here using @upstash/qstash Receiver
    
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const staleOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.Delivered,
        updatedAt: {
          lte: fortyEightHoursAgo,
        },
      },
    });

    const results = [];
    for (const order of staleOrders) {
      try {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.Completed,
            },
          }),
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: OrderStatus.Delivered,
              toStatus: OrderStatus.Completed,
              actorType: "System",
              notes: "Auto-completed after 48 hours without customer confirmation",
            },
          }),
        ]);
        results.push({ orderId: order.id, success: true });
      } catch (err: any) {
        results.push({ orderId: order.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: staleOrders.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during order auto-completion." },
      { status: 500 }
    );
  }
}
