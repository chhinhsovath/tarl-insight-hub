import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { validateTrainingAccess } from "@/lib/training-permissions";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const pool = new Pool({
  user: process.env.PGUSER || 'user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'tarl_insight_hub',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Upload training material file
export async function POST(request: NextRequest) {
  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const programId = formData.get('program_id') as string;
    const materialName = formData.get('material_name') as string;
    const description = formData.get('description') as string;
    const isRequired = formData.get('is_required') === 'true';

    if (!file || !programId || !materialName) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, program_id, material_name' 
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint, MP4, AVI, MOV, WebM' 
      }, { status: 400 });
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 50MB' 
      }, { status: 400 });
    }

    // Verify program exists
    const programCheck = await client.query(
      'SELECT id FROM tbl_tarl_training_programs WHERE id = $1 AND is_active = true',
      [parseInt(programId)]
    );

    if (programCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'uploads', 'training-materials', programId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${materialName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    const filePath = join(uploadDir, filename);
    const relativePath = join('uploads', 'training-materials', programId, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get next sort order
    const sortResult = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM tbl_tarl_training_materials WHERE program_id = $1',
      [parseInt(programId)]
    );
    const sortOrder = sortResult.rows[0].next_sort;

    // Save to database
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_materials (
        program_id, material_name, material_type, file_path, file_size, 
        file_type, original_filename, description, is_required, sort_order, created_by
      ) VALUES ($1, $2, 'file', $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, material_name, file_path, file_size, created_at
    `, [
      parseInt(programId),
      materialName,
      relativePath,
      file.size,
      file.type,
      file.name,
      description || null,
      isRequired,
      sortOrder,
      user.user_id
    ]);

    const material = result.rows[0];

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        material_type: 'file',
        file_type: file.type,
        original_filename: file.name
      },
      message: 'Training material uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading training material:', error);
    
    // Check for table not found
    if (error.code === '42P01') {
      return NextResponse.json({ 
        error: 'Training materials table not found. Please run database setup.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: `Internal server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  } finally {
    client.release();
  }
}