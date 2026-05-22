import { pool } from '../config/db';
import { Request } from 'express';

export const logAudit = async (
  req: Request | null,
  action: string,
  entity_type: string,
  entity_id?: string,
  payload?: any
) => {
  try {
    const user_id = req?.user?.id || null;
    const ip_address = req?.ip || req?.headers['x-forwarded-for'] || null;

    // Since system_audit_log was deleted, we log to console instead
    console.log(`[AUDIT LOG] Action: ${action}, Entity: ${entity_type}, EntityId: ${entity_id || 'N/A'}, User: ${user_id || 'System'}, IP: ${ip_address || 'N/A'}, Payload:`, payload || {});
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
