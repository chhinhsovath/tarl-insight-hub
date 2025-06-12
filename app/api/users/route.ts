import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  const users = await DatabaseService.getUsers()
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const data = await req.json()
  const user = await DatabaseService.createUser(data)
  return NextResponse.json(user)
}
