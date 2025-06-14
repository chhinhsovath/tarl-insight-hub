import { NextResponse } from "next/server"
import { db } from "@/lib/drizzle"
import { communes } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const districtId = searchParams.get("district_id")

    let allCommunes

    if (districtId) {
      allCommunes = await db.select().from(communes).where(eq(communes.district_id, parseInt(districtId)))
    } else {
      allCommunes = await db.select().from(communes)
    }
    
    return NextResponse.json(allCommunes)
  } catch (error: any) {
    console.error("Error fetching communes:", error)
    return NextResponse.json(
      { error: "Failed to fetch communes", details: error.message },
      { status: 500 }
    )
  }
} 