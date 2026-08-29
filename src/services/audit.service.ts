import { AuditLog } from '../models';
import { AppUser, AuditAction } from '../constants';
import { logger } from '../utils/logger';

interface RecordAuditParams {
  userName: AppUser;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Audit logging is best-effort: a failure to write an audit entry must
 * never block or fail the primary business operation.
 */
export async function recordAudit(params: RecordAuditParams): Promise<void> {
  try {
    await AuditLog.create({
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? {},
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Failed to write audit log', {
      action: params.action,
      entityType: params.entityType,
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
}
