import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import bcrypt from "bcrypt";

const pool = getPool();

export async function POST(request: Request) {
  try {
    const usersData = await request.json();

    if (!Array.isArray(usersData)) {
      return NextResponse.json({ message: "Expected an array of users" }, { status: 400 });
    }

    const client = await pool.connect();
    const defaultPassword = "password"; // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Hash the default password

    const insertPromises = usersData.map(async (user: any) => {
      const { usrName, usrEmail, usrType, usrSchoolBranch, usrSchoolID } = user;

      // Simple mapping for role, adjust as needed
      const role = usrType === "SANGAPAC" ? "observer" : "teacher"; 
      const emailToInsert = usrEmail === "" ? null : usrEmail; // Handle empty emails

      return client.query(
        `INSERT INTO tbl_tarl_users (name, email, password, role, province_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING *`,
        [usrName, emailToInsert, hashedPassword, role, usrSchoolBranch, usrSchoolID]
      );
    });

    const results = await Promise.all(insertPromises);
    client.release();

    // Filter out null results (from DO NOTHING on conflict)
    const insertedUsers = results.map(res => res.rows[0]).filter(Boolean);

    return NextResponse.json({ message: `Successfully inserted ${insertedUsers.length} users.` });
  } catch (error) {
    console.error("Error inserting users:", error);
    return NextResponse.json({ message: "Error inserting users" }, { status: 500 });
  }
} 