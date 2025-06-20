import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function POST(request: Request) {
  try {
    const cookiesStore = await cookies();
    const sessionToken = cookiesStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify session and check admin access
      const sessionResult = await client.query(
        `SELECT u.id, u.full_name, r.name as role FROM tbl_tarl_users u 
         LEFT JOIN tbl_tarl_roles r ON u.role_id = r.id 
         WHERE u.session_token = $1 AND u.session_expires > NOW()`,
        [sessionToken]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Invalid or expired session" },
          { status: 401 }
        );
      }

      const user = sessionResult.rows[0];
      if (!user.role || !['admin', 'director'].includes(user.role.toLowerCase())) {
        return NextResponse.json(
          { message: "Admin access required" },
          { status: 403 }
        );
      }

      console.log('Setting up participant demo accounts...');

      // 1. Create participant role if it doesn't exist
      await client.query(`
        INSERT INTO tbl_tarl_roles (name, description, hierarchy_level, can_manage_hierarchy, max_hierarchy_depth) 
        VALUES ('participant', 'Training participant with access to own sessions and feedback', 4, false, 0)
        ON CONFLICT (name) DO NOTHING
      `);

      // Get the participant role ID
      const roleResult = await client.query(
        "SELECT id FROM tbl_tarl_roles WHERE name = 'participant'"
      );
      const participantRoleId = roleResult.rows[0]?.id;

      if (!participantRoleId) {
        throw new Error('Failed to create participant role');
      }

      // 2. Hash the password
      const hashedPassword = await bcrypt.hash('participant123', 10);

      // 3. Create participant users
      const participants = [
        {
          username: 'participant1',
          email: 'participant1@tarl.edu.kh',
          full_name: 'Ms. Sophea Demo (Participant)',
          phone: '+855-12-345-678',
        },
        {
          username: 'participant2',
          email: 'participant2@tarl.edu.kh',
          full_name: 'Mr. Pisach Demo (Participant)',
          phone: '+855-12-345-679',
        }
      ];

      const createdUsers = [];
      
      for (const participant of participants) {
        // Insert or update user
        const userResult = await client.query(`
          INSERT INTO tbl_tarl_users (
            username, password, full_name, email, phone, role_id, role, is_active, 
            created_at, updated_at, failed_login_attempts, account_locked_until
          ) VALUES ($1, $2, $3, $4, $5, $6, 'participant', true, NOW(), NOW(), 0, NULL)
          ON CONFLICT (username) DO UPDATE SET
            password = EXCLUDED.password,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            role_id = EXCLUDED.role_id,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
          RETURNING id, username, full_name
        `, [
          participant.username,
          hashedPassword,
          participant.full_name,
          participant.email,
          participant.phone,
          participantRoleId
        ]);
        
        createdUsers.push(userResult.rows[0]);
      }

      // 4. Add participant portal page to permissions
      await client.query(`
        INSERT INTO page_permissions (page_name, page_path, description, icon_name, created_at, updated_at, sort_order, parent_page_id, is_parent_menu, menu_level)
        VALUES ('Training Portal', '/training/participant', 'Participant Portal', 'User', NOW(), NOW(), 30, null, false, 0)
        ON CONFLICT (page_path) DO NOTHING
      `);

      // 5. Add role page permissions for participants
      const trainingPages = ['/training', '/training/participant', '/training/feedback'];
      
      for (const pagePath of trainingPages) {
        // Get page ID
        const pageResult = await client.query(
          "SELECT id FROM page_permissions WHERE page_path = $1",
          [pagePath]
        );
        
        if (pageResult.rows.length > 0) {
          const pageId = pageResult.rows[0].id;
          
          // Add role page permission
          await client.query(`
            INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
            VALUES ('participant', $1, true, NOW(), NOW())
            ON CONFLICT (role, page_id) DO UPDATE SET
              is_allowed = true,
              updated_at = NOW()
          `, [pageId]);
        }
      }

      // 6. Create sample training participant entries if sessions exist
      const sessionsResult = await client.query(
        "SELECT id, session_title FROM tbl_tarl_training_sessions ORDER BY created_at DESC LIMIT 2"
      );

      if (sessionsResult.rows.length > 0) {
        for (let i = 0; i < participants.length && i < sessionsResult.rows.length; i++) {
          const sessionId = sessionsResult.rows[i].id;
          const participant = participants[i];
          
          await client.query(`
            INSERT INTO tbl_tarl_training_participants (
              session_id, participant_name, participant_email, participant_phone,
              participant_role, school_name, district, province,
              registration_method, registration_status, attendance_confirmed,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, 'Teacher', 'Demo School', 'Phnom Penh', 'Phnom Penh',
                     'admin', 'registered', true, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [sessionId, participant.full_name, participant.email, participant.phone]);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Participant demo accounts created successfully!',
        users: createdUsers,
        instructions: {
          accounts: [
            { username: 'participant1', password: 'participant123' },
            { username: 'participant2', password: 'participant123' }
          ],
          access: [
            'Training portal dashboard at /training/participant',
            'Submit feedback for registered sessions',
            'View training materials',
            'Track training progress'
          ]
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error setting up participant demo:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to setup participant demo accounts",
        error: error.message 
      },
      { status: 500 }
    );
  }
}