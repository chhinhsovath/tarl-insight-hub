import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getDbClient } from "@/lib/database-config";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const SESSION_EXPIRY_HOURS = 24;

export async function POST(request: Request) {
  try {
    const { identifier, password, loginType } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Identifier and password are required" },
        { status: 400 }
      );
    }

    const client = await getDbClient();

    try {
      let user = null;
      let userType = 'staff';
      
      // Determine login type automatically if not specified
      if (!loginType || loginType === 'auto') {
        // First try staff login (email/username + password)
        const staffResult = await client.query(
          `SELECT u.id, u.full_name, u.email, u.username, r.name as role, u.school_id, 
                  u.password, u.failed_login_attempts, u.account_locked_until, u.is_active
           FROM tbl_tarl_users u
           JOIN tbl_tarl_roles r ON u.role_id = r.id
           WHERE (u.email = $1 OR u.username = $1) AND u.is_active = true`,
          [identifier]
        );

        if (staffResult.rows.length > 0) {
          const staffUser = staffResult.rows[0];
          
          // Check if account is locked
          if (staffUser.account_locked_until && staffUser.account_locked_until > new Date()) {
            return NextResponse.json(
              { 
                message: "Account is locked. Please try again later.",
                lockedUntil: staffUser.account_locked_until
              },
              { status: 423 }
            );
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, staffUser.password);

          if (passwordMatch) {
            user = staffUser;
            userType = 'staff';
          } else {
            // Increment failed login attempts
            await client.query(
              `UPDATE tbl_tarl_users 
               SET failed_login_attempts = failed_login_attempts + 1,
                   account_locked_until = CASE 
                     WHEN failed_login_attempts + 1 >= $1 
                     THEN NOW() + ($2 || ' minutes')::interval
                     ELSE NULL 
                   END
               WHERE id = $3`,
              [MAX_FAILED_ATTEMPTS, LOCK_DURATION_MINUTES, staffUser.id]
            );
          }
        }
        
        // If staff login failed, try participant login (name + phone as password)
        if (!user) {
          const participantResult = await client.query(
            `SELECT 
              MIN(r.id) as first_registration_id,
              MIN(r.participant_name) as full_name,
              MIN(r.participant_email) as email,
              MIN(r.participant_phone) as phone,
              MIN(r.participant_role) as role,
              MIN(r.school_name) as organization,
              MIN(r.district) as district,
              MIN(r.province) as province,
              COUNT(r.id) as total_registrations,
              COUNT(CASE WHEN r.attendance_status = 'attended' THEN 1 END) as total_attended,
              MIN(r.created_at) as first_training_date,
              MAX(r.updated_at) as last_activity_date,
              CAST(
                (COUNT(CASE WHEN r.attendance_status = 'attended' THEN 1 END)::float / 
                 NULLIF(COUNT(r.id), 0) * 100) AS DECIMAL(5,2)
              ) as attendance_rate
            FROM tbl_tarl_training_registrations r
            WHERE 
              LOWER(TRIM(r.participant_name)) = LOWER(TRIM($1))
              AND TRIM(r.participant_phone) = TRIM($2)
              AND r.is_active = true
            GROUP BY 
              LOWER(TRIM(r.participant_name)), 
              TRIM(r.participant_phone)
            LIMIT 1`,
          [identifier, password]
          );

          if (participantResult.rows.length > 0) {
            const participantUser = participantResult.rows[0];
            user = {
              id: `participant_${participantUser.first_registration_id}`,
              full_name: participantUser.full_name,
              email: participantUser.email,
              phone: participantUser.phone,
              role: 'participant',
              organization: participantUser.organization,
              district: participantUser.district,
              province: participantUser.province,
              stats: {
                total_registrations: parseInt(participantUser.total_registrations),
                total_attended: parseInt(participantUser.total_attended),
                attendance_rate: parseFloat(participantUser.attendance_rate || 0),
                first_training_date: participantUser.first_training_date,
                last_activity_date: participantUser.last_activity_date
              },
              is_active: true
            };
            userType = 'participant';
          }
        }
      }

      if (!user) {
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Generate session token and expiry
      const sessionToken = randomBytes(32).toString('hex');
      const sessionExpires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

      if (userType === 'staff') {
        // Reset failed login attempts, update last login, and store session token for staff
        await client.query(
          `UPDATE tbl_tarl_users 
           SET failed_login_attempts = 0,
               account_locked_until = NULL,
               last_login = NOW(),
               session_token = $1,
               session_expires = $2
           WHERE id = $3`,
          [sessionToken, sessionExpires, user.id]
        );
      }

      // Set session cookie
      const cookiesStore = await cookies();
      cookiesStore.set('session-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: sessionExpires,
        path: '/',
        sameSite: 'lax',
      });

      // Set user type cookie for routing
      cookiesStore.set('user-type', userType, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: sessionExpires,
        path: '/',
        sameSite: 'lax',
      });

      // Determine redirect URL based on role
      let redirectUrl = '/dashboard';
      const role = user.role.toLowerCase();
      
      if (userType === 'participant') {
        redirectUrl = '/participant/dashboard';
      } else {
        // Role-based redirects for staff
        switch (role) {
          case 'admin':
            redirectUrl = '/admin';
            break;
          case 'director':
            redirectUrl = '/director';
            break;
          case 'teacher':
            redirectUrl = '/teacher';
            break;
          case 'coordinator':
            redirectUrl = '/coordinator';
            break;
          case 'partner':
            redirectUrl = '/partner';
            break;
          case 'collector':
            redirectUrl = '/collector';
            break;
          case 'intern':
            redirectUrl = '/intern';
            break;
          case 'training organizer':
            redirectUrl = '/training-organizer';
            break;
          default:
            redirectUrl = '/dashboard';
        }
      }

      // Remove sensitive fields from response
      const { password: _, failed_login_attempts: __, account_locked_until: ___, ...userWithoutSensitiveData } = user;

      return NextResponse.json({
        user: userWithoutSensitiveData,
        userType,
        redirectUrl,
        // For participants, also return localStorage data for backward compatibility
        participantSession: userType === 'participant' ? {
          id: user.id,
          name: user.full_name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          organization: user.organization,
          district: user.district,
          province: user.province,
          stats: user.stats,
          loginTime: new Date().toISOString()
        } : null
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Unified login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}