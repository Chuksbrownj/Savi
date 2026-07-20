const fs = require('fs');

function replaceFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (const [find, rep] of replacements) {
        content = content.replace(find, rep);
    }
    fs.writeFileSync(path, content, 'utf8');
}

// 1. DTOs
replaceFile('apps/api/src/modules/business/application/dtos/business-dispatch.dto.ts', [
    [/orderId: string;/g, 'orderId!: string;'],
    [/riderId: string;/g, 'riderId!: string;'],
    [/type: DispatchTaskType;/g, 'type!: DispatchTaskType;']
]);

replaceFile('apps/api/src/modules/business/application/dtos/business-order.dto.ts', [
    [/reason: string;/g, 'reason!: string;'],
    [/status: OrderStatus;/g, 'status!: OrderStatus;'],
    [/amount: number;/g, 'amount!: number;']
]);

// 2. confirm-payment.use-case.ts
replaceFile('apps/api/src/modules/business/application/use-cases/confirm-payment.use-case.ts', [
    [/method: 'MANUAL',/g, "method: PaymentMethod.PayOnDelivery,"],
    [/sum \+ p\.amount/g, "sum + Number(p.amount)"],
    [/totalPaid >= order\.totalAmount/g, "totalPaid >= Number(order.total)"]
]);

// 3. manage-services-pricing.use-cases.ts
replaceFile('apps/api/src/modules/business/application/use-cases/manage-services-pricing.use-cases.ts', [
    [/\.\.\.data,/g, "...data,\n      description: data.description ?? null,"]
]);

// 4. manage-settlements.use-cases.ts
replaceFile('apps/api/src/modules/business/application/use-cases/manage-settlements.use-cases.ts', [
    [/select: \{ totalAmount: true \}/g, "select: { total: true }"],
    [/totalAmount,\n/g, "totalAmount: new Prisma.Decimal(totalAmount),\n"]
]);

// 5. manage-staff.use-cases.ts
replaceFile('apps/api/src/modules/business/application/use-cases/manage-staff.use-cases.ts', [
    [/employeeCode: data\.employeeCode,/g, "employeeCode: data.employeeCode ?? null,"],
    [/vehicleId: data\.vehicleId,/g, "vehicleId: data.vehicleId ?? null,"]
]);

console.log("Done");
