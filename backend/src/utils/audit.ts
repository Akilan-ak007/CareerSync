import prisma from './prisma.js';

interface AuditLogParams {
  userId?: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  oldValue?: any;
  newValue?: any;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        role: params.role,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ipAddress: params.ipAddress || null,
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : null,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
