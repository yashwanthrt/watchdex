import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const totalEpisodes = body.totalEpisodes || 0;

    const show = await prisma.shows.create({
      data: {
        title: body.title,
        source: body.source,
        source_id: String(body.id),
        poster_url: body.poster,
        type: body.type,
        total_episodes: totalEpisodes,
        episodes_watched:
          body.watch_status === "completed"
            ? totalEpisodes
            : body.episodes_watched || 0,
        watch_status: body.watch_status || "planned",
        is_completed: body.watch_status === "completed",
        release_status: body.status || null,
      },
    });

    return NextResponse.json(show);
  } catch (error: any) {
    console.error("ADD SHOW ERROR:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Show already in watchlist" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add show" },
      { status: 500 }
    );
  }
}