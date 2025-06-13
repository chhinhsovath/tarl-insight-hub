import { UsersTable } from "@/components/users/users-table"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

async function getUsers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/users`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error("Failed to fetch users")
  }
  return res.json()
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const users = await getUsers()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <UsersTable users={users} onUserUpdate={() => {}} />
    </div>
  )
} 