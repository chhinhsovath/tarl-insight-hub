import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const client = await pool.connect();
    let queryText = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*) AS total_observations,
        SUM(CASE WHEN assessment_level_id = 1 THEN 1 ELSE 0 END) AS assessment_level_1,
        SUM(CASE WHEN assessment_level_id = 2 THEN 1 ELSE 0 END) AS assessment_level_2,
        SUM(CASE WHEN assessment_level_id = 3 THEN 1 ELSE 0 END) AS assessment_level_3,
        SUM(CASE WHEN assessment_level_id = 4 THEN 1 ELSE 0 END) AS assessment_level_4,
        SUM(CASE WHEN assessment_level_id = 5 THEN 1 ELSE 0 END) AS assessment_level_5
      FROM tbl_tarl_observation_responses
    `;
    const queryParams = [];

    if (userId) {
      queryText += ' WHERE user_id = $1';
      queryParams.push(userId);
    }

    queryText += `
      GROUP BY month
      ORDER BY month
    `;

    const res = await client.query(queryText, queryParams);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching observation stats:", error);
    return NextResponse.json({ message: "Error fetching observation stats" }, { status: 500 });
  }
} 