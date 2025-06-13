import { db } from "@/lib/db"
import { observations, schools, users } from "@/lib/schema"
import { desc, eq, sql } from "drizzle-orm"

export async function getRecentObservations() {
  const recentObservations = await db
    .select({
      id: observations.id,
      school: {
        name: schools.name,
      },
      observer: {
        name: users.name,
        image: users.image,
      },
      createdAt: observations.createdAt,
      status: observations.status,
    })
    .from(observations)
    .leftJoin(schools, eq(observations.schoolId, schools.id))
    .leftJoin(users, eq(observations.observerId, users.id))
    .orderBy(desc(observations.createdAt))
    .limit(5)

  return recentObservations
}

export async function getObservationsByMonth() {
  const monthlyData = await db
    .select({
      month: sql<string>`to_char(${observations.createdAt}, 'Mon YYYY')`,
      total: sql<number>`count(*)`,
    })
    .from(observations)
    .groupBy(sql`to_char(${observations.createdAt}, 'Mon YYYY')`)
    .orderBy(sql`to_char(${observations.createdAt}, 'Mon YYYY')`)
    .limit(12)

  return monthlyData
} 