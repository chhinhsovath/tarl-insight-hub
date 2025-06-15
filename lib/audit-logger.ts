import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

interface AuditLogEntry {
  action_type: string;
  entity_type: string;
  entity_id?: number;
  role_name?: string;
  page_name?: string;
  page_path?: string;
  previous_value?: string;
  new_value?: string;
  changed_by_user_id: number;
  changed_by_username?: string;
  changed_by_role?: string;
  description: string;
  metadata?: any;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    const client = await pool.connect();
    
    try {
      // Check if audit table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'permission_audit_log'
      `);

      if (tableCheck.rows.length === 0) {
        // Audit table doesn't exist, skip logging
        console.warn('Audit table does not exist. Skipping audit log entry.');
        return;
      }

      await client.query(`
        INSERT INTO permission_audit_log (
          action_type, entity_type, entity_id, role_name, page_name, page_path,
          previous_value, new_value, changed_by_user_id, changed_by_username, 
          changed_by_role, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        entry.action_type,
        entry.entity_type,
        entry.entity_id || null,
        entry.role_name || null,
        entry.page_name || null,
        entry.page_path || null,
        entry.previous_value || null,
        entry.new_value || null,
        entry.changed_by_user_id,
        entry.changed_by_username || null,
        entry.changed_by_role || null,
        entry.description,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]);

    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Don't throw error to avoid breaking main functionality
    } finally {
      client.release();
    }
  }

  static async logPermissionChange(
    action: 'granted' | 'revoked',
    roleName: string,
    pageName: string,
    pagePath: string,
    changedByUserId: number,
    changedByUsername?: string,
    changedByRole?: string
  ): Promise<void> {
    await this.log({
      action_type: `permission_${action}`,
      entity_type: 'permission',
      role_name: roleName,
      page_name: pageName,
      page_path: pagePath,
      previous_value: action === 'granted' ? 'false' : 'true',
      new_value: action === 'granted' ? 'true' : 'false',
      changed_by_user_id: changedByUserId,
      changed_by_username: changedByUsername,
      changed_by_role: changedByRole,
      description: `${action === 'granted' ? 'Granted' : 'Revoked'} "${roleName}" role access to "${pageName}" page`,
      metadata: { page_path: pagePath, action }
    });
  }

  static async logRoleChange(
    action: 'created' | 'updated' | 'deleted',
    roleId: number,
    roleName: string,
    changedByUserId: number,
    previousName?: string,
    changedByUsername?: string,
    changedByRole?: string
  ): Promise<void> {
    let description = '';
    let previousValue = null;
    let newValue = null;

    switch (action) {
      case 'created':
        description = `Created new role "${roleName}"`;
        newValue = roleName;
        break;
      case 'updated':
        description = `Updated role "${previousName}" to "${roleName}"`;
        previousValue = previousName;
        newValue = roleName;
        break;
      case 'deleted':
        description = `Deleted role "${roleName}"`;
        previousValue = roleName;
        break;
    }

    await this.log({
      action_type: `role_${action}`,
      entity_type: 'role',
      entity_id: roleId,
      role_name: roleName,
      previous_value: previousValue,
      new_value: newValue,
      changed_by_user_id: changedByUserId,
      changed_by_username: changedByUsername,
      changed_by_role: changedByRole,
      description,
      metadata: { role_id: roleId, action }
    });
  }

  static async logPageChange(
    action: 'created' | 'updated' | 'deleted',
    pageId: number,
    pageName: string,
    pagePath: string,
    changedByUserId: number,
    changedByUsername?: string,
    changedByRole?: string
  ): Promise<void> {
    await this.log({
      action_type: `page_${action}`,
      entity_type: 'page',
      entity_id: pageId,
      page_name: pageName,
      page_path: pagePath,
      changed_by_user_id: changedByUserId,
      changed_by_username: changedByUsername,
      changed_by_role: changedByRole,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} page "${pageName}" (${pagePath})`,
      metadata: { page_id: pageId, page_path: pagePath, action }
    });
  }

  static async logMenuOrderChange(
    changedByUserId: number,
    pageCount: number,
    changedByUsername?: string,
    changedByRole?: string
  ): Promise<void> {
    await this.log({
      action_type: 'menu_reordered',
      entity_type: 'menu',
      changed_by_user_id: changedByUserId,
      changed_by_username: changedByUsername,
      changed_by_role: changedByRole,
      description: `Reordered menu items (${pageCount} pages affected)`,
      metadata: { page_count: pageCount, action: 'reorder' }
    });
  }
}