import { Pool } from 'pg';

interface AuditLogEntry {
  userId?: number;
  username?: string;
  userRole?: string;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'RESTORE';
  tableName?: string;
  recordId?: number;
  oldData?: any;
  newData?: any;
  changesSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionToken?: string;
  isSoftDelete?: boolean;
}

interface SoftDeleteOptions {
  tableName: string;
  recordId: number;
  userId: number;
  username: string;
  deleteReason?: string;
}

interface RestoreOptions {
  tableName: string;
  recordId: number;
  userId: number;
  username: string;
}

export class AuditLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log user activity to the audit system
   */
  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO tbl_tarl_user_activities (
          user_id, username, user_role, action_type, table_name, record_id,
          old_data, new_data, changes_summary, ip_address, user_agent, 
          session_token, is_soft_delete
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      await this.pool.query(query, [
        entry.userId,
        entry.username,
        entry.userRole,
        entry.actionType,
        entry.tableName,
        entry.recordId,
        entry.oldData ? JSON.stringify(entry.oldData) : null,
        entry.newData ? JSON.stringify(entry.newData) : null,
        entry.changesSummary,
        entry.ipAddress,
        entry.userAgent,
        entry.sessionToken,
        entry.isSoftDelete || false
      ]);
    } catch (error) {
      console.error('Failed to log audit activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Set session variables for database triggers
   */
  async setSessionVariables(userId: number, username: string, userRole?: string): Promise<void> {
    try {
      await this.pool.query(`SET app.current_user_id = $1`, [userId.toString()]);
      await this.pool.query(`SET app.current_username = $1`, [username]);
      if (userRole) {
        await this.pool.query(`SET app.current_user_role = $1`, [userRole]);
      }
    } catch (error) {
      console.error('Failed to set session variables:', error);
    }
  }

  /**
   * Perform soft delete using database function
   */
  async softDelete(options: SoftDeleteOptions): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT soft_delete_record($1, $2, $3, $4, $5) as success`,
        [options.tableName, options.recordId, options.userId, options.username, options.deleteReason]
      );

      const success = result.rows[0]?.success || false;

      // Log the soft delete activity
      if (success) {
        await this.logActivity({
          userId: options.userId,
          username: options.username,
          actionType: 'DELETE',
          tableName: options.tableName,
          recordId: options.recordId,
          changesSummary: `Soft deleted ${options.tableName} record with ID ${options.recordId}${options.deleteReason ? `: ${options.deleteReason}` : ''}`,
          isSoftDelete: true
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to soft delete record:', error);
      return false;
    }
  }

  /**
   * Restore soft-deleted record using database function
   */
  async restoreRecord(options: RestoreOptions): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT restore_deleted_record($1, $2, $3, $4) as success`,
        [options.tableName, options.recordId, options.userId, options.username]
      );

      return result.rows[0]?.success || false;
    } catch (error) {
      console.error('Failed to restore record:', error);
      return false;
    }
  }

  /**
   * Get recent user activities
   */
  async getRecentActivities(limit: number = 50, userId?: number): Promise<any[]> {
    try {
      let query = `
        SELECT * FROM v_recent_user_activities
      `;
      const params: any[] = [];

      if (userId) {
        query += ` WHERE user_id = $1`;
        params.push(userId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }

  /**
   * Get restorable records
   */
  async getRestorableRecords(tableName?: string): Promise<any[]> {
    try {
      let query = `SELECT * FROM v_restorable_records`;
      const params: any[] = [];

      if (tableName) {
        query += ` WHERE table_name = $1`;
        params.push(tableName);
      }

      query += ` ORDER BY deleted_at DESC`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get restorable records:', error);
      return [];
    }
  }

  /**
   * Get training audit summary
   */
  async getTrainingAuditSummary(days: number = 30): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM v_training_audit_summary
        WHERE activity_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY activity_date DESC, table_name, action_type
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Failed to get training audit summary:', error);
      return [];
    }
  }

  /**
   * Cleanup old deleted records (admin function)
   */
  async cleanupOldDeletedRecords(olderThanDays: number = 365): Promise<number> {
    try {
      const result = await this.pool.query(
        `SELECT cleanup_old_deleted_records($1) as cleanup_count`,
        [olderThanDays]
      );

      return result.rows[0]?.cleanup_count || 0;
    } catch (error) {
      console.error('Failed to cleanup old deleted records:', error);
      return 0;
    }
  }

  /**
   * Helper to create audit entry for CRUD operations
   */
  createAuditEntry(
    actionType: AuditLogEntry['actionType'],
    tableName: string,
    recordId: number,
    userData: { userId?: number; username?: string; userRole?: string },
    oldData?: any,
    newData?: any,
    request?: { ip?: string; userAgent?: string; sessionToken?: string }
  ): AuditLogEntry {
    let changesSummary = '';
    
    switch (actionType) {
      case 'CREATE':
        changesSummary = `Created new ${tableName} record with ID ${recordId}`;
        break;
      case 'UPDATE':
        changesSummary = `Updated ${tableName} record with ID ${recordId}`;
        break;
      case 'DELETE':
        changesSummary = `Deleted ${tableName} record with ID ${recordId}`;
        break;
      case 'READ':
        changesSummary = `Accessed ${tableName} record with ID ${recordId}`;
        break;
      default:
        changesSummary = `${actionType} operation on ${tableName} record with ID ${recordId}`;
    }

    return {
      userId: userData.userId,
      username: userData.username,
      userRole: userData.userRole,
      actionType,
      tableName,
      recordId,
      oldData,
      newData,
      changesSummary,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      sessionToken: request?.sessionToken,
      isSoftDelete: actionType === 'DELETE'
    };
  }
}

// Helper function to get client IP from request
export function getClientIP(request: any): string | undefined {
  return request.ip || 
         request.connection?.remoteAddress || 
         request.socket?.remoteAddress ||
         (request.headers && (
           request.headers['x-forwarded-for'] ||
           request.headers['x-real-ip'] ||
           request.headers['x-client-ip']
         ));
}

// Helper function to extract user data from session
export function getUserDataFromSession(session: any): { userId?: number; username?: string; userRole?: string } {
  return {
    userId: session?.user?.id,
    username: session?.user?.username,
    userRole: session?.user?.role
  };
}

// Export singleton instance
let auditLoggerInstance: AuditLogger | null = null;

export function getAuditLogger(pool: Pool): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(pool);
  }
  return auditLoggerInstance;
}