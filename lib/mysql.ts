import mysql from "mysql2/promise"
export type { ResultSetHeader } from "mysql2/promise"

let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env
    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
      throw new Error("MySQL environment variables are not set")
    }
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectionLimit: 10,
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]) {
  const [rows] = await getPool().execute(sql, params)
  return rows as T
}
