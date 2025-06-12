import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provinceId = searchParams.get('provinceId')
  const districts = provinceId
    ? await DatabaseService.getDistrictsByProvince(Number(provinceId))
    : await DatabaseService.getDistricts()
  return NextResponse.json(districts)
}
