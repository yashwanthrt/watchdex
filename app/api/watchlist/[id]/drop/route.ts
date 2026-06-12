import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const show = await prisma.shows.update({
      where: { id: parseInt(id) },
      data: { watch_status: "dropped" },
    });
    return NextResponse.json(show);
  } catch (error) {
    console.error("DROP ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}