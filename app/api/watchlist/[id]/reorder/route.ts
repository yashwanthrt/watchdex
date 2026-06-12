import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const show = await prisma.shows.update({
      where: { id: parseInt(id) },
      data: { sort_order: body.sort_order },
    });

    return NextResponse.json(show);
  } catch (error) {
    console.error("REORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    );
  }
}