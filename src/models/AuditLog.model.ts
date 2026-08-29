import { Schema, model, Document } from 'mongoose';
import { APP_USERS, AppUser, AUDIT_ACTIONS, AuditAction } from '../constants';

export interface IAuditLog extends Document {
  userName: AppUser;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userName: { type: String, enum: APP_USERS, required: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userName: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
