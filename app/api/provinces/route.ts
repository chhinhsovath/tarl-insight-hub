import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  const provinces = await DatabaseService.getProvinces()
  return NextResponse.json(provinces)
}
