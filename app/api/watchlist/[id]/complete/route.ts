import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.shows.findUnique({
      where: { id: parseInt(id) },
    });

    const show = await prisma.shows.update({
      where: { id: parseInt(id) },
      data: {
        watch_status: "completed",
        is_completed: true,
        episodes_watched:
          existing?.total_episodes && existing.total_episodes > 0
            ? existing.total_episodes
            : existing?.episodes_watched || 0,
      },
    });

    return NextResponse.json(show);
  } catch (error) {
    console.error("COMPLETE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}