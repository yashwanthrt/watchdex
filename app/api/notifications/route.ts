import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function getLatestEpisodeCount(
  source: string,
  sourceId: string
): Promise<number> {
  try {
    if (source === "tv") {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${sourceId}?api_key=${TMDB_API_KEY}`
      );
      const data = await res.json();
      return data.number_of_episodes || 0;
    }

    if (source === "anime") {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime/${sourceId}`
      );
      const data = await res.json();
      return data.data?.episodes || 0;
    }
  } catch (_) {}
  return 0;
}

export async function GET() {
  try {
    const trackedShows = await prisma.shows.findMany({
      where: {
        watch_status: {
          in: ["watching", "completed"],
        },
      },
    });

    const notifications: {
      id: number;
      title: string;
      poster_url: string | null;
      newEpisodes: number;
      totalEpisodes: number;
    }[] = [];

    for (const show of trackedShows) {
      try {
        const latestCount =
          await getLatestEpisodeCount(
            show.source,
            show.source_id
          );

        if (
          latestCount > 0 &&
          latestCount > show.total_episodes
        ) {
          const newEpisodes =
            latestCount - show.total_episodes;

          notifications.push({
            id: show.id,
            title: show.title,
            poster_url: show.poster_url,
            newEpisodes,
            totalEpisodes: latestCount,
          });

          await prisma.shows.update({
            where: { id: show.id },
            data: {
              total_episodes: latestCount,
              last_notified_episodes: latestCount,
              ...(show.watch_status === "completed" && {
                watch_status: "watching",
                is_completed: false,
              }),
            },
          });
        } else if (
          show.last_notified_episodes === 0 &&
          latestCount > 0
        ) {
          await prisma.shows.update({
            where: { id: show.id },
            data: {
              last_notified_episodes: latestCount,
            },
          });
        }
      } catch (_) {}
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("NOTIFICATIONS ERROR:", error);
    return NextResponse.json([]);
  }
}