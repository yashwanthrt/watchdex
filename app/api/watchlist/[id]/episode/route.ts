import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const show = await prisma.shows.update({
      where: { id: parseInt(id) },
      data:
        body.set !== undefined
          ? {
              episodes_watched: body.set,
              watch_status: "watching",
            }
          : {
              episodes_watched: { increment: 1 },
              watch_status: "watching",
            },
    });

    return NextResponse.json(show);
  } catch (error) {
    console.error("EPISODE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}