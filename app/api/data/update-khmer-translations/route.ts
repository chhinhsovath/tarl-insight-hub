import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Khmer translations mapping
const khmerTranslations = {
  // Main navigation items
  'Dashboard': 'ផ្ទាំងគ្រប់គ្រង',
  'Schools': 'សាលារៀន',
  'Users': 'អ្នកប្រើប្រាស់',
  'Analytics': 'ការវិភាគ',
  'Reports': 'របាយការណ៍',
  'System Admin': 'ការគ្រប់គ្រងប្រព័ន្ធ',
  'Settings': 'ការកំណត់',
  'Students': 'សិស្ស',
  'Observations': 'ការសង្កេត',
  'Progress': 'ការវឌ្ឍនភាព',
  'Visits': 'ការទស្សនកិច្ច',
  'Data Collection': 'ការប្រមូលទិន្នន័យ',
  'Collection': 'ការប្រមូលទិន្នន័យ',
  
  // Settings and management
  'Pages Management': 'ការគ្រប់គ្រងទំព័រ',
  'Page Management': 'ការគ្រប់គ្រងទំព័រ',
  'Hierarchy Management': 'ការគ្រប់គ្រងសាខា',
  'Hierarchical Management': 'ការគ្រប់គ្រងសាខា',
  
  // Training section
  'Training': 'ការបណ្តុះបណ្តាល',
  'Programs': 'កម្មវិធី',
  'Sessions': 'វគ្គសិក្សា',
  'Participants': 'អ្នកចូលរួម',
  'QR Codes': 'កូដ QR',
  'Feedback': 'មតិកែលម្អ',
};

const khmerTitles = {
  // Core navigation titles
  'Main Dashboard': 'ផ្ទាំងគ្រប់គ្រងសំខាន់',
  'School Management': 'ការគ្រប់គ្រងសាលារៀន',
  'User Management': 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់',
  'Data Analytics': 'ការវិភាគទិន្នន័យ',
  'System Reports': 'របាយការណ៍ប្រព័ន្ធ',
  'System Administration': 'ការគ្រប់គ្រងប្រព័ន្ធ',
  'Student Management': 'ការគ្រប់គ្រងសិស្ស',
  'Classroom Observations': 'ការសង្កេតថ្នាក់រៀន',
  'Progress Tracking': 'ការតាមដានការវឌ្ឍនភាព',
  'School Visits': 'ការទស្សនកិច្ចសាលារៀន',
  'Data Collection Tools': 'ឧបករណ៍ប្រមូលទិន្នន័យ',
  
  // Settings and management titles
  'Page Management': 'ការគ្រប់គ្រងទំព័រ',
  'Hierarchical Management': 'ការគ្រប់គ្រងតាមសាខា',
  
  // Training section titles
  'Training Management': 'ការគ្រប់គ្រងការបណ្តុះបណ្តាល',
  'Training Programs': 'កម្មវិធីបណ្តុះបណ្តាល',
  'Training Sessions': 'វគ្គបណ្តុះបណ្តាល',
  'Training Participants': 'អ្នកចូលរួមបណ្តុះបណ្តាល',
  'QR Code Management': 'ការគ្រប់គ្រងកូដ QR',
  'Training Feedback': 'មតិកែលម្អបណ្តុះបណ្តាល',
};

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin session
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    if (user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check if Khmer columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('page_name_kh', 'page_title_kh')
    `);

    if (columnCheck.rows.length < 2) {
      // Add Khmer columns if they don't exist
      await pool.query(`
        ALTER TABLE page_permissions 
        ADD COLUMN IF NOT EXISTS page_name_kh VARCHAR(200),
        ADD COLUMN IF NOT EXISTS page_title_kh VARCHAR(200)
      `);
    }

    // Get all pages to update
    const pagesResult = await pool.query(`
      SELECT id, page_name, page_title, page_name_kh, page_title_kh
      FROM page_permissions
      ORDER BY id
    `);

    let updatedCount = 0;
    
    // Update each page with Khmer translations
    for (const page of pagesResult.rows) {
      const khmerName = khmerTranslations[page.page_name] || page.page_name_kh;
      const khmerTitle = khmerTitles[page.page_title] || khmerTitles[page.page_name] || page.page_title_kh;

      if (khmerName || khmerTitle) {
        await pool.query(`
          UPDATE page_permissions 
          SET 
            page_name_kh = COALESCE($1, page_name_kh),
            page_title_kh = COALESCE($2, page_title_kh)
          WHERE id = $3
        `, [khmerName, khmerTitle, page.id]);
        
        updatedCount++;
      }
    }

    // Get updated results
    const updatedPages = await pool.query(`
      SELECT 
        id,
        page_path,
        page_name,
        page_name_kh,
        page_title,
        page_title_kh
      FROM page_permissions 
      WHERE page_name_kh IS NOT NULL 
      ORDER BY id
    `);

    // Get statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(page_name_kh) as pages_with_khmer_names,
        COUNT(page_title_kh) as pages_with_khmer_titles
      FROM page_permissions
    `);

    return NextResponse.json({
      success: true,
      message: 'Khmer translations updated successfully',
      updated_count: updatedCount,
      statistics: stats.rows[0],
      updated_pages: updatedPages.rows
    });

  } catch (error) {
    console.error("Error updating Khmer translations:", error);
    return NextResponse.json({ 
      error: "Failed to update translations", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current translation status
    const result = await pool.query(`
      SELECT 
        id,
        page_path,
        page_name,
        page_name_kh,
        page_title,
        page_title_kh,
        CASE 
          WHEN page_name_kh IS NOT NULL AND page_name_kh != page_name THEN true 
          ELSE false 
        END as has_khmer_name,
        CASE 
          WHEN page_title_kh IS NOT NULL AND page_title_kh != page_title THEN true 
          ELSE false 
        END as has_khmer_title
      FROM page_permissions 
      ORDER BY id
    `);

    // Get summary statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(CASE WHEN page_name_kh IS NOT NULL AND page_name_kh != page_name THEN 1 END) as pages_with_khmer_names,
        COUNT(CASE WHEN page_title_kh IS NOT NULL AND page_title_kh != page_title THEN 1 END) as pages_with_khmer_titles
      FROM page_permissions
    `);

    return NextResponse.json({
      pages: result.rows,
      statistics: stats.rows[0],
      available_translations: {
        page_names: Object.keys(khmerTranslations),
        page_titles: Object.keys(khmerTitles)
      }
    });

  } catch (error) {
    console.error("Error fetching translation status:", error);
    return NextResponse.json({ 
      error: "Failed to fetch translation status", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}