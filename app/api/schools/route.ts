import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provinceId = searchParams.get('provinceId')
  const districtId = searchParams.get('districtId')
  let schools
  if (provinceId) {
    schools = await DatabaseService.getSchoolsByProvince(Number(provinceId))
  } else if (districtId) {
    schools = await DatabaseService.getSchoolsByDistrict(Number(districtId))
  } else {
    schools = await DatabaseService.getSchools()
  }
  return NextResponse.json(schools)
}

export async function POST(req: Request) {
  const data = await req.json()
  const school = await DatabaseService.createSchool(data)
  return NextResponse.json(school)
}
