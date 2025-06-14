import { NextResponse } from "next/server"
import { db } from "@/lib/drizzle"
import { villages } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const communeId = searchParams.get("commune_id")

    let allVillages

    if (communeId) {
      allVillages = await db.select().from(villages).where(eq(villages.commune_id, parseInt(communeId)))
    } else {
      allVillages = await db.select().from(villages)
    }
    
    return NextResponse.json(allVillages)
  } catch (error: any) {
    console.error("Error fetching villages:", error)
    return NextResponse.json(
      { error: "Failed to fetch villages", details: error.message },
      { status: 500 }
    )
  }
} 