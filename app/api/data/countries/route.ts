import { NextResponse } from "next/server"
import { db } from "@/lib/drizzle"
import { countries } from "@/lib/schema"

export async function GET() {
  try {
    const allCountries = await db.select().from(countries)
    return NextResponse.json(allCountries)
  } catch (error: any) {
    console.error("Error fetching countries:", error)
    return NextResponse.json(
      { error: "Failed to fetch countries", details: error.message },
      { status: 500 }
    )
  }
} 