import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { validateTrainingAccess } from "@/lib/training-permissions";
import { unlink } from 'fs/promises';
import { join } from 'path';

const pool = new Pool({
  user: process.env.PGUSER || 'user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'tarl_insight_hub',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch training materials for a program
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('program_id');

  if (!programId) {
    return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        tm.*,
        COALESCE(tm.material_name, tm.material_title) as material_name,
        creator.full_name as created_by_name
      FROM tbl_tarl_training_materials tm
      LEFT JOIN tbl_tarl_users creator ON tm.created_by = creator.id
      WHERE tm.program_id = $1 AND tm.is_active = true
      ORDER BY tm.sort_order ASC, tm.created_at DESC
    `;

    const result = await client.query(query, [parseInt(programId)]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching training materials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Add new link material
export async function POST(request: NextRequest) {
  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { program_id, material_name, external_url, description, is_required } = body;

    if (!program_id || !material_name || !external_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: program_id, material_name, external_url' 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(external_url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Verify program exists
    const programCheck = await client.query(
      'SELECT id FROM tbl_tarl_training_programs WHERE id = $1 AND is_active = true',
      [parseInt(program_id)]
    );

    if (programCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    // Get next sort order
    const sortResult = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM tbl_tarl_training_materials WHERE program_id = $1',
      [parseInt(program_id)]
    );
    const sortOrder = sortResult.rows[0].next_sort;

    // Create the link material
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_materials (
        program_id, material_name, material_type, external_url, 
        description, is_required, sort_order, created_by
      ) VALUES ($1, $2, 'link', $3, $4, $5, $6, $7)
      RETURNING id, material_name, external_url, description, is_required, created_at
    `, [
      parseInt(program_id),
      material_name,
      external_url,
      description || null,
      is_required || false,
      sortOrder,
      user.user_id
    ]);

    const material = result.rows[0];

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        material_type: 'link'
      },
      message: 'Link material added successfully'
    });

  } catch (error) {
    console.error('Error creating link material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update material
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get('id');

  if (!materialId) {
    return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const { material_name, description, is_required, external_url } = body;

    // For link materials, validate URL if provided
    if (external_url) {
      try {
        new URL(external_url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_materials SET
        material_name = COALESCE($1, material_name),
        description = COALESCE($2, description),
        is_required = COALESCE($3, is_required),
        external_url = CASE 
          WHEN material_type = 'link' THEN COALESCE($4, external_url)
          ELSE external_url
        END,
        updated_at = NOW()
      WHERE id = $5 AND is_active = true
      RETURNING *
    `, [
      material_name, description, is_required, external_url, parseInt(materialId)
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training material not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      material: updateResult.rows[0],
      message: 'Training material updated successfully'
    });

  } catch (error) {
    console.error('Error updating training material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Remove material
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get('id');

  if (!materialId) {
    return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'delete');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const client = await pool.connect();

  try {
    // Get material info before deleting
    const materialInfo = await client.query(
      'SELECT * FROM tbl_tarl_training_materials WHERE id = $1 AND is_active = true',
      [parseInt(materialId)]
    );

    if (materialInfo.rows.length === 0) {
      return NextResponse.json({ error: 'Training material not found' }, { status: 404 });
    }

    const material = materialInfo.rows[0];

    // Delete from database first
    await client.query(
      'UPDATE tbl_tarl_training_materials SET is_active = false, updated_at = NOW() WHERE id = $1',
      [parseInt(materialId)]
    );

    // If it's a file material, try to delete the physical file
    if (material.material_type === 'file' && material.file_path) {
      try {
        const fullPath = join(process.cwd(), material.file_path);
        await unlink(fullPath);
      } catch (fileError) {
        console.warn('Could not delete physical file:', fileError);
        // Don't fail the request if file deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Training material "${material.material_name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting training material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}