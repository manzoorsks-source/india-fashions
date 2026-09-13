import { run } from '../db/database.js';
import { AuthenticatedRequest } from './auth.js';

export function recordAudit(
  req: AuthenticatedRequest,
  entity: string,
  entityId: string,
  action: string,
  previousValue?: any,
  newValue?: any
) {
  const actorId = req.user?.id || 'system';
  const actorName = req.user?.name || 'Store Operations';
  const actorRole = req.user?.role || 'SYSTEM';

  const auditId = 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  run(`INSERT INTO audit_logs (
    id, actor_id, actor_name, actor_role, entity, entity_id, action, previous_value, new_value, timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    auditId,
    actorId,
    actorName,
    actorRole,
    entity,
    entityId,
    action,
    previousValue ? JSON.stringify(previousValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    now
  ]);
}
