import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function validateSession(sessionToken: string) {
  const result = await pool.query(
    `SELECT id, role FROM tbl_tarl_users 
     WHERE session_token = $1 AND session_expires > NOW() AND is_active = true`,
    [sessionToken]
  );
  return result.rows[0];
}

// GET /api/training/photo-activities - Get photo activities for a session
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const query = `
      SELECT 
        pa.*,
        u.full_name as uploader_name,
        u.role_id as uploader_role
      FROM tbl_training_photo_activities pa
      JOIN tbl_tarl_users u ON pa.uploaded_by = u.id
      WHERE pa.session_id = $1 AND pa.is_active = true
      ORDER BY pa.activity_date DESC, pa.sort_order ASC, pa.created_at DESC
    `;

    const result = await pool.query(query, [sessionId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching photo activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo activities" },
      { status: 500 }
    );
  }
}

// POST /api/training/photo-activities - Create new photo activity
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const activityDate = formData.get("activityDate") as string;
    const activityTime = formData.get("activityTime") as string;
    const location = formData.get("location") as string;
    const isFeatured = formData.get("isFeatured") === "true";
    const isPublic = formData.get("isPublic") === "true";
    const photo = formData.get("photo") as File;

    if (!sessionId || !title || !photo) {
      return NextResponse.json(
        { error: "Session ID, title, and photo are required" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'training', 'photos');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, fileName);
    const relativePath = path.join('uploads', 'training', 'photos', fileName);

    // Save file
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Insert into database
    const insertQuery = `
      INSERT INTO tbl_training_photo_activities (
        session_id, title, description, photo_path, photo_name, photo_size, 
        photo_type, activity_date, activity_time, location, uploaded_by, 
        is_featured, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      sessionId,
      title,
      description,
      relativePath,
      photo.name,
      photo.size,
      photo.type,
      activityDate || null,
      activityTime || null,
      location,
      user.id,
      isFeatured,
      isPublic
    ]);

    return NextResponse.json({
      message: "Photo activity created successfully",
      photoActivity: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating photo activity:", error);
    
    // Check if it's a database table error
    if (error instanceof Error && error.message.includes('relation "tbl_training_photo_activities" does not exist')) {
      return NextResponse.json(
        { 
          error: "Photo activities table not found",
          details: "Please run the database setup script: setup-photo-activities.sql"
        },
        { status: 500 }
      );
    }
    
    // Check if it's a file system error
    if (error instanceof Error && (error.message.includes('ENOENT') || error.message.includes('no such file'))) {
      return NextResponse.json(
        { 
          error: "Failed to save photo file",
          details: "Unable to create uploads directory or save file"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create photo activity",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT /api/training/photo-activities - Update photo activity
export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id, title, description, activityDate, activityTime, location, isFeatured, isPublic } = await request.json();

    if (!id || !title) {
      return NextResponse.json(
        { error: "ID and title are required" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE tbl_training_photo_activities 
      SET title = $1, description = $2, activity_date = $3, activity_time = $4, 
          location = $5, is_featured = $6, is_public = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND uploaded_by = $9
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      title,
      description,
      activityDate || null,
      activityTime || null,
      location,
      isFeatured,
      isPublic,
      id,
      user.id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Photo activity not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Photo activity updated successfully",
      photoActivity: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating photo activity:", error);
    return NextResponse.json(
      { error: "Failed to update photo activity" },
      { status: 500 }
    );
  }
}

// DELETE /api/training/photo-activities - Delete photo activity
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE tbl_training_photo_activities 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND uploaded_by = $2
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [id, user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Photo activity not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Photo activity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting photo activity:", error);
    return NextResponse.json(
      { error: "Failed to delete photo activity" },
      { status: 500 }
    );
  }
}