import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export interface ActionPermission {
  id: number;
  page_id: number;
  action_name: string;
  role: string;
  is_allowed: boolean;
  page_name?: string;
  page_path?: string;
}

export interface UserActionPermissions {
  page_name: string;
  page_path: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
    bulk_update: boolean;
  };
}

export class ActionPermissionManager {
  /**
   * Check if a user has permission to perform a specific action on a page
   */
  static async canPerformAction(
    userRole: string, 
    pageName: string, 
    actionName: string
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // Check if action permissions table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'page_action_permissions'
      `);

      if (tableCheck.rows.length === 0) {
        // Fallback to basic page permission if action permissions not set up
        const pagePermResult = await client.query(`
          SELECT rpp.is_allowed 
          FROM role_page_permissions rpp
          JOIN page_permissions pp ON rpp.page_id = pp.id
          WHERE rpp.role = $1 AND pp.page_name = $2
        `, [userRole, pageName]);
        
        // If they can access the page, allow 'view', restrict others for non-admin
        if (pagePermResult.rows.length > 0 && pagePermResult.rows[0].is_allowed) {
          return actionName === 'view' || userRole.toLowerCase() === 'admin';
        }
        return false;
      }

      // Check action-specific permission
      const result = await client.query(`
        SELECT pap.is_allowed 
        FROM page_action_permissions pap
        JOIN page_permissions pp ON pap.page_id = pp.id
        WHERE pap.role = $1 AND pp.page_name = $2 AND pap.action_name = $3
      `, [userRole, pageName, actionName]);

      if (result.rows.length === 0) {
        // If no specific action permission exists, default to basic page access for 'view'
        if (actionName === 'view') {
          const pagePermResult = await client.query(`
            SELECT rpp.is_allowed 
            FROM role_page_permissions rpp
            JOIN page_permissions pp ON rpp.page_id = pp.id
            WHERE rpp.role = $1 AND pp.page_name = $2
          `, [userRole, pageName]);
          
          return pagePermResult.rows.length > 0 && pagePermResult.rows[0].is_allowed;
        }
        return false;
      }

      return result.rows[0].is_allowed;
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get all action permissions for a user's role across all accessible pages
   */
  static async getUserActionPermissions(userRole: string): Promise<UserActionPermissions[]> {
    const client = await pool.connect();
    
    try {
      // Check if action permissions table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'page_action_permissions'
      `);

      if (tableCheck.rows.length === 0) {
        // Fallback to basic page permissions
        const pagesResult = await client.query(`
          SELECT pp.page_name, pp.page_path
          FROM page_permissions pp
          JOIN role_page_permissions rpp ON pp.id = rpp.page_id
          WHERE rpp.role = $1 AND rpp.is_allowed = true
        `, [userRole]);

        return pagesResult.rows.map(page => ({
          page_name: page.page_name,
          page_path: page.page_path,
          actions: {
            view: true,
            create: userRole.toLowerCase() === 'admin',
            update: userRole.toLowerCase() === 'admin',
            delete: userRole.toLowerCase() === 'admin',
            export: userRole.toLowerCase() === 'admin',
            bulk_update: userRole.toLowerCase() === 'admin'
          }
        }));
      }

      // Get action permissions with page info
      const result = await client.query(`
        SELECT 
          pp.page_name,
          pp.page_path,
          pap.action_name,
          pap.is_allowed
        FROM page_action_permissions pap
        JOIN page_permissions pp ON pap.page_id = pp.id
        JOIN role_page_permissions rpp ON pp.id = rpp.page_id
        WHERE pap.role = $1 AND rpp.role = $1 AND rpp.is_allowed = true
        ORDER BY pp.page_name, pap.action_name
      `, [userRole]);

      // Group by page
      const pagePermissions: Record<string, UserActionPermissions> = {};
      
      result.rows.forEach(row => {
        const pageKey = row.page_name;
        
        if (!pagePermissions[pageKey]) {
          pagePermissions[pageKey] = {
            page_name: row.page_name,
            page_path: row.page_path,
            actions: {
              view: false,
              create: false,
              update: false,
              delete: false,
              export: false,
              bulk_update: false
            }
          };
        }
        
        if (row.action_name in pagePermissions[pageKey].actions) {
          (pagePermissions[pageKey].actions as any)[row.action_name] = row.is_allowed;
        }
      });

      return Object.values(pagePermissions);
    } catch (error) {
      console.error('Error getting user action permissions:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get action permissions for a specific page and role
   */
  static async getPageActionPermissions(pageName: string, role?: string): Promise<ActionPermission[]> {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          pap.id,
          pap.page_id,
          pap.action_name,
          pap.role,
          pap.is_allowed,
          pp.page_name,
          pp.page_path
        FROM page_action_permissions pap
        JOIN page_permissions pp ON pap.page_id = pp.id
        WHERE pp.page_name = $1
      `;
      
      const params = [pageName];
      
      if (role) {
        query += ' AND pap.role = $2';
        params.push(role);
      }
      
      query += ' ORDER BY pap.role, pap.action_name';
      
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting page action permissions:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Update action permission for a specific role, page, and action
   */
  static async updateActionPermission(
    pageId: number, 
    role: string, 
    actionName: string, 
    isAllowed: boolean,
    changedBy?: { userId: number; username: string; role: string }
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get page name for audit trail
      const pageResult = await client.query('SELECT page_name FROM page_permissions WHERE id = $1', [pageId]);
      const pageName = pageResult.rows[0]?.page_name || 'Unknown';
      
      // Check current permission state
      const currentResult = await client.query(`
        SELECT is_allowed FROM page_action_permissions 
        WHERE page_id = $1 AND role = $2 AND action_name = $3
      `, [pageId, role, actionName]);
      
      const isUpdate = currentResult.rows.length > 0;
      const previousState = currentResult.rows[0]?.is_allowed;
      
      // Update or insert permission
      const result = await client.query(`
        UPDATE page_action_permissions 
        SET is_allowed = $1, updated_at = NOW()
        WHERE page_id = $2 AND role = $3 AND action_name = $4
      `, [isAllowed, pageId, role, actionName]);

      // If no rows were updated, create the permission
      if (result.rowCount === 0) {
        await client.query(`
          INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
          VALUES ($1, $2, $3, $4)
        `, [pageId, role, actionName, isAllowed]);
      }

      // Log the change in audit trail if audit table exists
      try {
        const auditTableCheck = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_name = 'permission_audit_log'
        `);
        
        if (auditTableCheck.rows.length > 0 && changedBy) {
          const actionType = isUpdate 
            ? (isAllowed ? 'action_permission_granted' : 'action_permission_revoked')
            : (isAllowed ? 'action_permission_created_granted' : 'action_permission_created_revoked');
          
          const description = isUpdate
            ? `${actionType.replace('_', ' ').replace('action permission ', '')} '${actionName}' permission for role '${role}' on page '${pageName}' (was ${previousState ? 'granted' : 'revoked'})`
            : `${actionType.replace('_', ' ').replace('action permission ', '')} '${actionName}' permission for role '${role}' on page '${pageName}'`;
          
          await client.query(`
            INSERT INTO permission_audit_log (
              action_type, description, page_id, role_affected, 
              changed_by_user_id, changed_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [actionType, description, pageId, role, changedBy.userId, changedBy.username]);
        }
      } catch (auditError) {
        console.warn('Failed to log permission change to audit trail:', auditError);
        // Don't fail the main operation if audit logging fails
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating action permission:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get all available actions across the system
   */
  static getAvailableActions(): string[] {
    return ['view', 'create', 'update', 'delete', 'export', 'bulk_update'];
  }

  /**
   * Get default actions for a page type
   */
  static getDefaultActionsForPage(pageName: string): string[] {
    const defaultActions: Record<string, string[]> = {
      'schools': ['view', 'create', 'update', 'delete', 'export'],
      'users': ['view', 'create', 'update', 'delete', 'export'],
      'observations': ['view', 'create', 'update', 'delete', 'export'],
      'reports': ['view', 'export'],
      'settings': ['view', 'update'],
    };

    const normalizedPageName = pageName.toLowerCase().replace(/\s+/g, '_');
    return defaultActions[normalizedPageName] || ['view'];
  }
}