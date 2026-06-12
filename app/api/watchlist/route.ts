import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const shows = await prisma.shows.findMany({
      orderBy: [
        { sort_order: "asc" },
        { created_at: "desc" },
      ],
    });

    return NextResponse.json(shows);
  } catch (error) {
    console.error("WATCHLIST ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}