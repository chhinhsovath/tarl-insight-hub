import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { validateTrainingAccess } from "@/lib/training-permissions";
import { getAuditLogger } from "@/lib/audit-logger";

const pool = getPool();
const auditLogger = getAuditLogger(pool);

// GET - Fetch audit logs (admin only)
export async function GET(request: NextRequest) {
  // Validate admin access
  const authResult = await validateTrainingAccess('training-programs', 'view');
  
  if (!authResult.success || authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const userId = searchParams.get('user_id');
  const tableName = searchParams.get('table_name');
  const actionType = searchParams.get('action_type');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const isSoftDelete = searchParams.get('is_soft_delete');

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        ua.*,
        u.full_name as user_full_name
      FROM tbl_tarl_user_activities ua
      LEFT JOIN tbl_tarl_users u ON ua.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (userId) {
      query += ` AND ua.user_id = $${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }

    if (tableName) {
      query += ` AND ua.table_name = $${paramIndex}`;
      params.push(tableName);
      paramIndex++;
    }

    if (actionType) {
      query += ` AND ua.action_type = $${paramIndex}`;
      params.push(actionType);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ua.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ua.created_at <= $${paramIndex}`;
      params.push(endDate + ' 23:59:59');
      paramIndex++;
    }

    if (isSoftDelete === 'true') {
      query += ` AND ua.is_soft_delete = true`;
    } else if (isSoftDelete === 'false') {
      query += ` AND (ua.is_soft_delete = false OR ua.is_soft_delete IS NULL)`;
    }

    query += ` ORDER BY ua.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await client.query(query, params);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN action_type = 'CREATE' THEN 1 END) as creates,
        COUNT(CASE WHEN action_type = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN action_type = 'DELETE' THEN 1 END) as deletes,
        COUNT(CASE WHEN action_type = 'READ' THEN 1 END) as reads,
        COUNT(CASE WHEN is_soft_delete = true THEN 1 END) as soft_deletes
      FROM tbl_tarl_user_activities
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const statsResult = await client.query(statsQuery);

    return NextResponse.json({
      activities: result.rows,
      statistics: statsResult.rows[0],
      totalRecords: result.rows.length,
      filters: {
        userId,
        tableName,
        actionType,
        startDate,
        endDate,
        isSoftDelete,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// GET specific endpoints for different audit views
export async function POST(request: NextRequest) {
  // Validate admin access
  const authResult = await validateTrainingAccess('training-programs', 'view');
  
  if (!authResult.success || authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  const client = await pool.connect();

  try {
    switch (action) {
      case 'recent_activities':
        const recentActivities = await auditLogger.getRecentActivities(body.limit || 50, body.userId);
        return NextResponse.json({ activities: recentActivities });

      case 'training_summary':
        const trainingSummary = await auditLogger.getTrainingAuditSummary(body.days || 30);
        return NextResponse.json({ summary: trainingSummary });

      case 'user_activities':
        if (!body.userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const userActivities = await auditLogger.getRecentActivities(body.limit || 50, body.userId);
        return NextResponse.json({ activities: userActivities });

      case 'table_activities':
        if (!body.tableName) {
          return NextResponse.json({ error: 'Table name required' }, { status: 400 });
        }
        
        const tableQuery = `
          SELECT * FROM v_recent_user_activities 
          WHERE table_name = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        `;
        const tableResult = await client.query(tableQuery, [body.tableName, body.limit || 50]);
        return NextResponse.json({ activities: tableResult.rows });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing audit request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}