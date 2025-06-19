import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import archiver from 'archiver';
import { Readable } from 'stream';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Download training materials for a specific session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);
    const body = await request.json();
    const { participant_name, participant_phone } = body;

    if (!participant_name || !participant_phone) {
      return NextResponse.json({ 
        error: 'Participant credentials required' 
      }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Verify participant attended this session
      const attendanceCheck = await client.query(`
        SELECT r.id, r.attendance_status, s.session_title
        FROM tbl_tarl_training_registrations r
        JOIN tbl_tarl_training_sessions s ON r.session_id = s.id
        WHERE 
          r.session_id = $1
          AND LOWER(TRIM(r.participant_name)) = LOWER(TRIM($2))
          AND TRIM(r.participant_phone) = TRIM($3)
          AND r.is_active = true
      `, [sessionId, participant_name, participant_phone]);

      if (attendanceCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'You are not registered for this training session' 
        }, { status: 403 });
      }

      const registration = attendanceCheck.rows[0];
      
      // Only allow material download for attended sessions
      if (registration.attendance_status !== 'attended') {
        return NextResponse.json({ 
          error: 'Materials are only available for attended training sessions' 
        }, { status: 403 });
      }

      // Get training materials for this session
      const materialsQuery = `
        SELECT 
          id,
          material_name,
          material_type,
          file_path,
          file_size,
          description,
          created_at
        FROM tbl_tarl_training_materials
        WHERE session_id = $1 AND is_active = true
        ORDER BY created_at ASC
      `;

      const materialsResult = await client.query(materialsQuery, [sessionId]);

      if (materialsResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No materials available for this training session' 
        }, { status: 404 });
      }

      // Log the download activity
      await client.query(`
        INSERT INTO tbl_tarl_material_downloads (
          session_id, participant_name, participant_phone, download_time, materials_count
        ) VALUES ($1, $2, $3, NOW(), $4)
      `, [sessionId, participant_name, participant_phone, materialsResult.rows.length]);

      // Create a zip file with all materials
      const archive = archiver('zip', {
        zlib: { level: 9 } // compression level
      });

      // Create material info text file
      const materialsList = materialsResult.rows.map(material => 
        `${material.material_name}\n` +
        `Type: ${material.material_type}\n` +
        `Description: ${material.description || 'No description'}\n` +
        `Created: ${new Date(material.created_at).toLocaleDateString()}\n` +
        `-------------------\n`
      ).join('\n');

      const infoContent = `Training Materials\n` +
        `Session: ${registration.session_title}\n` +
        `Participant: ${participant_name}\n` +
        `Downloaded: ${new Date().toLocaleString()}\n\n` +
        `Materials Included:\n${materialsList}`;

      archive.append(infoContent, { name: 'README.txt' });

      // Add each material file to the archive
      for (const material of materialsResult.rows) {
        try {
          // For now, we'll create placeholder files since we don't have actual file storage
          // In a real implementation, you'd read from the file_path
          const placeholderContent = `Training Material: ${material.material_name}\n\n` +
            `This is a placeholder for the actual training material.\n` +
            `Type: ${material.material_type}\n` +
            `Description: ${material.description}\n\n` +
            `In a production environment, this would contain the actual file content.`;
          
          const fileExtension = material.material_type === 'presentation' ? '.pdf' : 
                               material.material_type === 'document' ? '.docx' : '.txt';
          
          archive.append(placeholderContent, { 
            name: `${material.material_name}${fileExtension}` 
          });
        } catch (fileError) {
          console.error(`Error adding material ${material.id}:`, fileError);
          // Continue with other files
        }
      }

      // Finalize the archive
      archive.finalize();

      // Convert archive stream to buffer
      const chunks: Buffer[] = [];
      const readable = new Readable().wrap(archive);
      
      for await (const chunk of readable) {
        chunks.push(chunk);
      }
      
      const zipBuffer = Buffer.concat(chunks);

      // Return the zip file
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${registration.session_title.replace(/[^a-zA-Z0-9]/g, '_')}_materials.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error downloading materials:', error);
    return NextResponse.json({ 
      error: 'Failed to download materials' 
    }, { status: 500 });
  }
}