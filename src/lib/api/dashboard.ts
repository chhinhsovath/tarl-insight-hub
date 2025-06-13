import { db } from "@/lib/db"

export async function getDashboardStats() {
  const [
    totalObservations,
    totalSchools,
    totalObservers,
    averageScore
  ] = await Promise.all([
    db.query.observations.count(),
    db.query.schools.count(),
    db.query.users.count(),
    db.query.observations.aggregate({
      _avg: {
        score: true
      }
    })
  ])

  return {
    totalObservations,
    totalSchools,
    totalObservers,
    averageScore: averageScore._avg.score || 0
  }
} 