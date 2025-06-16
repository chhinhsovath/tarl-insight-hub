import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import * as QRCode from 'qrcode';
import { validateTrainingAccess } from "@/lib/training-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch QR codes for a session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const codeType = searchParams.get('type');
  
  // Validate training access
  const authResult = await validateTrainingAccess('training-qr-codes', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    let query = `
      SELECT 
        qr.*,
        ts.session_title,
        ts.session_date,
        creator.full_name as created_by_name
      FROM tbl_tarl_qr_codes qr
      LEFT JOIN tbl_tarl_training_sessions ts ON qr.session_id = ts.id
      LEFT JOIN tbl_tarl_users creator ON qr.created_by = creator.id
      WHERE qr.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (sessionId) {
      query += ` AND qr.session_id = $${paramIndex}`;
      params.push(parseInt(sessionId));
      paramIndex++;
    }

    if (codeType) {
      query += ` AND qr.code_type = $${paramIndex}`;
      params.push(codeType);
      paramIndex++;
    }

    query += ` ORDER BY qr.created_at DESC`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Generate new QR code
export async function POST(request: NextRequest) {
  // Validate training access
  const authResult = await validateTrainingAccess('training-qr-codes', 'create');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    const body = await request.json();
    const { session_id, code_type, expires_at, max_usage } = body;

    if (!session_id || !code_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: session_id, code_type' 
      }, { status: 400 });
    }

    // Validate code type
    const validTypes = ['registration', 'attendance', 'feedback', 'materials'];
    if (!validTypes.includes(code_type)) {
      return NextResponse.json({ 
        error: `Invalid code type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Check if session exists
    const sessionCheck = await client.query(`
      SELECT id, session_title FROM tbl_tarl_training_sessions 
      WHERE id = $1 AND is_active = true
    `, [parseInt(session_id)]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    // Generate unique QR data URL - we'll update with actual ID after creating the record
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    let qrDataTemplate;
    switch (code_type) {
      case 'registration':
        qrDataTemplate = `${baseUrl}/training/register?session=${session_id}&qr=`;
        break;
      case 'attendance':
        qrDataTemplate = `${baseUrl}/training/attendance?session=${session_id}&qr=`;
        break;
      case 'feedback':
        qrDataTemplate = `${baseUrl}/training/public-feedback?session=${session_id}&qr=`;
        break;
      case 'materials':
        qrDataTemplate = `${baseUrl}/training/materials?session=${session_id}&qr=`;
        break;
      default:
        qrDataTemplate = `${baseUrl}/training/session/${session_id}?qr=`;
    }

    // Create the QR code record first with temporary data
    const result = await client.query(`
      INSERT INTO tbl_tarl_qr_codes (
        code_type, session_id, qr_data, expires_at, max_usage, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, code_type, expires_at, max_usage, created_at
    `, [
      code_type,
      parseInt(session_id),
      'temp', // temporary data
      expires_at ? new Date(expires_at) : null,
      max_usage || null,
      user.user_id
    ]);

    const newQrCode = result.rows[0];
    
    // Now generate the final QR data with the actual ID
    const qrData = qrDataTemplate + newQrCode.id;

    // Generate QR code image
    const qrCodeImage = await generateQrCodeImage(qrData);

    // Update with final QR data and image
    await client.query(`
      UPDATE tbl_tarl_qr_codes SET qr_data = $1, qr_code_image = $2 WHERE id = $3
    `, [qrData, qrCodeImage, newQrCode.id]);

    return NextResponse.json({
      success: true,
      qr_code: {
        ...newQrCode,
        qr_code_image: qrCodeImage,
        session_title: sessionCheck.rows[0].session_title
      },
      message: 'QR code generated successfully'
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update QR code (deactivate, update usage limits, etc.)
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qrId = searchParams.get('id');

  if (!qrId) {
    return NextResponse.json({ error: 'QR code ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-qr-codes', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    const body = await request.json();
    const { is_active, expires_at, max_usage } = body;

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(is_active);
      paramIndex++;
    }

    if (expires_at !== undefined) {
      updateFields.push(`expires_at = $${paramIndex}`);
      updateValues.push(expires_at ? new Date(expires_at) : null);
      paramIndex++;
    }

    if (max_usage !== undefined) {
      updateFields.push(`max_usage = $${paramIndex}`);
      updateValues.push(max_usage);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateValues.push(parseInt(qrId));

    const updateQuery = `
      UPDATE tbl_tarl_qr_codes SET
        ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING id, code_type, qr_data, expires_at, max_usage, is_active
    `;

    const updateResult = await client.query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      qr_code: updateResult.rows[0],
      message: 'QR code updated successfully'
    });

  } catch (error) {
    console.error('Error updating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Helper function to generate QR code image
async function generateQrCodeImage(data: string): Promise<string> {
  try {
    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Fallback to a simple placeholder
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="black"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          QR Error: ${data.substring(0, 20)}...
        </text>
      </svg>
    `).toString('base64')}`;
  }
}

// POST - Log QR code usage (when someone scans)
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qrId = searchParams.get('qr_id');
  const sessionId = searchParams.get('session_id');

  if (!qrId || !sessionId) {
    return NextResponse.json({ error: 'QR ID and Session ID are required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const { participant_id, action_type, user_agent, ip_address, scan_data } = body;

    // Verify QR code is valid and not expired
    const qrCheck = await client.query(`
      SELECT * FROM tbl_tarl_qr_codes 
      WHERE id = $1 AND session_id = $2 AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_usage IS NULL OR usage_count < max_usage)
    `, [parseInt(qrId), parseInt(sessionId)]);

    if (qrCheck.rows.length === 0) {
      return NextResponse.json({ error: 'QR code is invalid, expired, or usage limit exceeded' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Log the usage
    await client.query(`
      INSERT INTO tbl_tarl_qr_usage_log (
        qr_code_id, session_id, participant_id, action_type, 
        user_agent, ip_address, scan_data, scan_result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'success')
    `, [
      parseInt(qrId),
      parseInt(sessionId),
      participant_id || null,
      action_type || 'scan',
      user_agent || null,
      ip_address || null,
      scan_data ? JSON.stringify(scan_data) : null
    ]);

    // Update usage count and last used time
    await client.query(`
      UPDATE tbl_tarl_qr_codes 
      SET usage_count = usage_count + 1, last_used_at = NOW()
      WHERE id = $1
    `, [parseInt(qrId)]);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'QR code usage logged successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error logging QR code usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}