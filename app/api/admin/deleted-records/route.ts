import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { validateTrainingAccess } from "@/lib/training-permissions";
import { getAuditLogger, getClientIP } from "@/lib/audit-logger";

const pool = getPool();
const auditLogger = getAuditLogger(pool);

// GET - Fetch deleted records that can be restored (admin only)
export async function GET(request: NextRequest) {
  // Validate admin access
  const authResult = await validateTrainingAccess('training-programs', 'view');
  
  if (!authResult.success || authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table_name');
  const limit = parseInt(searchParams.get('limit') || '50');
  const showExpired = searchParams.get('show_expired') === 'true';

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        dr.*,
        deleter.full_name as deleted_by_full_name,
        restorer.full_name as restored_by_full_name,
        CASE 
          WHEN dr.deleted_at + INTERVAL '1 day' * dr.retention_period_days < NOW() THEN false
          ELSE dr.can_be_restored
        END as is_still_restorable,
        (dr.deleted_at + INTERVAL '1 day' * dr.retention_period_days) as expires_at
      FROM tbl_tarl_deleted_records dr
      LEFT JOIN tbl_tarl_users deleter ON dr.deleted_by = deleter.id
      LEFT JOIN tbl_tarl_users restorer ON dr.restored_by = restorer.id
      WHERE dr.is_restored = false
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (tableName) {
      query += ` AND dr.table_name = $${paramIndex}`;
      params.push(tableName);
      paramIndex++;
    }

    if (!showExpired) {
      query += ` AND dr.deleted_at + INTERVAL '1 day' * dr.retention_period_days >= NOW()`;
    }

    query += ` ORDER BY dr.deleted_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await client.query(query, params);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_deleted,
        COUNT(CASE WHEN is_restored = false THEN 1 END) as pending_restore,
        COUNT(CASE WHEN is_restored = true THEN 1 END) as already_restored,
        COUNT(CASE WHEN deleted_at + INTERVAL '1 day' * retention_period_days < NOW() THEN 1 END) as expired,
        COUNT(DISTINCT table_name) as affected_tables
      FROM tbl_tarl_deleted_records
    `;

    const statsResult = await client.query(statsQuery);

    // Get table breakdown
    const tableBreakdownQuery = `
      SELECT 
        table_name,
        COUNT(*) as count,
        COUNT(CASE WHEN is_restored = false THEN 1 END) as pending_restore
      FROM tbl_tarl_deleted_records
      GROUP BY table_name
      ORDER BY count DESC
    `;

    const tableBreakdownResult = await client.query(tableBreakdownQuery);

    return NextResponse.json({
      deletedRecords: result.rows,
      statistics: statsResult.rows[0],
      tableBreakdown: tableBreakdownResult.rows,
      filters: {
        tableName,
        limit,
        showExpired
      }
    });

  } catch (error) {
    console.error('Error fetching deleted records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Restore a deleted record (admin only)
export async function POST(request: NextRequest) {
  // Validate admin access
  const authResult = await validateTrainingAccess('training-programs', 'delete');
  
  if (!authResult.success || authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const user = authResult.user!;
  const body = await request.json();
  const { tableName, recordId, reason } = body;

  if (!tableName || !recordId) {
    return NextResponse.json({ 
      error: 'Missing required fields: tableName, recordId' 
    }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Check if record exists in deleted records and can be restored
    const deletedRecordCheck = await client.query(`
      SELECT * FROM tbl_tarl_deleted_records 
      WHERE table_name = $1 AND record_id = $2 AND is_restored = false
    `, [tableName, recordId]);

    if (deletedRecordCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Deleted record not found or already restored' 
      }, { status: 404 });
    }

    const deletedRecord = deletedRecordCheck.rows[0];

    // Check if record is still within retention period
    const expiresAt = new Date(deletedRecord.deleted_at);
    expiresAt.setDate(expiresAt.getDate() + deletedRecord.retention_period_days);
    
    if (new Date() > expiresAt && deletedRecord.can_be_restored) {
      return NextResponse.json({ 
        error: 'Record has expired and can no longer be restored' 
      }, { status: 400 });
    }

    // Use audit logger restore function
    const success = await auditLogger.restoreRecord({
      tableName,
      recordId: parseInt(recordId),
      userId: user.user_id,
      username: user.username
    });

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to restore record. Record may not exist or is not deleted.' 
      }, { status: 500 });
    }

    // Log additional restore activity with reason
    await auditLogger.logActivity({
      userId: user.user_id,
      username: user.username,
      userRole: user.role,
      actionType: 'RESTORE',
      tableName,
      recordId: parseInt(recordId),
      changesSummary: `Admin restored ${tableName} record ID ${recordId}${reason ? `: ${reason}` : ''}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    // Get the restored record data
    const restoredRecordQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
    const restoredResult = await client.query(restoredRecordQuery, [parseInt(recordId)]);

    return NextResponse.json({
      success: true,
      message: `Record restored successfully from ${tableName}`,
      restoredRecord: restoredResult.rows[0] || null,
      tableName,
      recordId: parseInt(recordId)
    });

  } catch (error) {
    console.error('Error restoring record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Permanently delete old records (admin only)
export async function DELETE(request: NextRequest) {
  // Validate admin access
  const authResult = await validateTrainingAccess('training-programs', 'delete');
  
  if (!authResult.success || authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get('older_than_days') || '365');

  if (olderThanDays < 30) {
    return NextResponse.json({ 
      error: 'Cannot permanently delete records newer than 30 days' 
    }, { status: 400 });
  }

  try {
    const cleanupCount = await auditLogger.cleanupOldDeletedRecords(olderThanDays);

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${cleanupCount} old records`,
      deletedCount: cleanupCount,
      olderThanDays
    });

  } catch (error) {
    console.error('Error cleaning up old records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}