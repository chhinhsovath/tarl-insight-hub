import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const pool = getPool();

async function validateSession(sessionToken: string) {
  const result = await pool.query(
    `SELECT u.id, u.role_id FROM tbl_tarl_users u 
     JOIN user_sessions s ON u.id = s.user_id 
     WHERE s.session_token = $1 AND s.expires_at > NOW()`,
    [sessionToken]
  );
  return result.rows[0];
}

// GET /api/training/engage-materials - Get materials for an engage program
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT * FROM tbl_training_engage_materials 
       WHERE engage_program_id = $1 AND is_active = true 
       ORDER BY created_at`,
      [programId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// POST /api/training/engage-materials - Create a new material
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const engage_program_id = formData.get("engage_program_id") as string;
    const material_type = formData.get("material_type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const external_url = formData.get("external_url") as string;
    const file = formData.get("file") as File | null;

    if (!engage_program_id || !material_type || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let file_path = null;
    let file_name = null;
    let file_size = null;
    let file_type = null;

    // Handle file upload if material type is document
    if (material_type === "document" && file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public", "uploads", "training", "materials");
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const finalFilename = `${uniqueSuffix}-${filename}`;
      const filePath = path.join(uploadDir, finalFilename);

      // Write file
      await writeFile(filePath, buffer);

      file_path = `/uploads/training/materials/${finalFilename}`;
      file_name = file.name;
      file_size = file.size;
      file_type = file.type;
    }

    // Validate that either file or URL is provided
    if (material_type === "document" && !file_path) {
      return NextResponse.json(
        { error: "Document file is required" },
        { status: 400 }
      );
    }

    if (material_type === "link" && !external_url) {
      return NextResponse.json(
        { error: "External URL is required for links" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO tbl_training_engage_materials 
       (engage_program_id, material_type, title, description, file_path, file_name, 
        file_size, file_type, external_url, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        engage_program_id,
        material_type,
        title,
        description,
        file_path,
        file_name,
        file_size,
        file_type,
        external_url,
        user.id,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}

// PUT /api/training/engage-materials - Update a material
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, external_url, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 }
      );
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (external_url !== undefined) {
      updates.push(`external_url = $${paramCount++}`);
      values.push(external_url);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tbl_training_engage_materials 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

// DELETE /api/training/engage-materials - Delete a material
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 }
      );
    }

    // Soft delete
    const result = await pool.query(
      `UPDATE tbl_training_engage_materials 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}