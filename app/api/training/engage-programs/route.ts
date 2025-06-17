import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

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

// GET /api/training/engage-programs - Get engage programs for a session
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Get engage programs with their materials
    const query = `
      SELECT 
        ep.id,
        ep.session_id,
        ep.title,
        ep.description,
        ep.timing,
        ep.sort_order,
        ep.is_active,
        ep.created_at,
        ep.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', em.id,
              'material_type', em.material_type,
              'title', em.title,
              'description', em.description,
              'file_path', em.file_path,
              'file_name', em.file_name,
              'file_size', em.file_size,
              'file_type', em.file_type,
              'external_url', em.external_url,
              'download_count', em.download_count,
              'is_active', em.is_active
            ) ORDER BY em.created_at
          ) FILTER (WHERE em.id IS NOT NULL), 
          '[]'::json
        ) as materials
      FROM tbl_training_engage_programs ep
      LEFT JOIN tbl_training_engage_materials em ON ep.id = em.engage_program_id AND em.is_active = true
      WHERE ep.session_id = $1 AND ep.is_active = true
      GROUP BY ep.id
      ORDER BY ep.timing, ep.sort_order
    `;

    const result = await pool.query(query, [sessionId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching engage programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch engage programs" },
      { status: 500 }
    );
  }
}

// POST /api/training/engage-programs - Create a new engage program
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

    const body = await request.json();
    const { session_id, title, description, timing, sort_order } = body;

    if (!session_id || !title || !timing) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO tbl_training_engage_programs 
       (session_id, title, description, timing, sort_order, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [session_id, title, description, timing, sort_order || 0, user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating engage program:", error);
    return NextResponse.json(
      { error: "Failed to create engage program" },
      { status: 500 }
    );
  }
}

// PUT /api/training/engage-programs - Update an engage program
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
    const { id, title, description, timing, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Program ID is required" },
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
    if (timing !== undefined) {
      updates.push(`timing = $${paramCount++}`);
      values.push(timing);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tbl_training_engage_programs 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating engage program:", error);
    return NextResponse.json(
      { error: "Failed to update engage program" },
      { status: 500 }
    );
  }
}

// DELETE /api/training/engage-programs - Delete an engage program
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
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    // Soft delete
    const result = await pool.query(
      `UPDATE tbl_training_engage_programs 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting engage program:", error);
    return NextResponse.json(
      { error: "Failed to delete engage program" },
      { status: 500 }
    );
  }
}