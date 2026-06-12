import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");
  const id = searchParams.get("id");

  if (!source || !id) {
    return NextResponse.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  try {
    if (source === "tv") {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
      );
      const data = await res.json();

      return NextResponse.json({
        title: data.name,
        synopsis: data.overview,
        poster: data.poster_path
          ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
          : null,
        backdrop: data.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
          : null,
        genres: data.genres?.map((g: any) => g.name) || [],
        rating: data.vote_average
          ? parseFloat(data.vote_average.toFixed(1))
          : null,
        status: data.status,
        firstAired: data.first_air_date,
        network: data.networks?.[0]?.name || null,
        totalEpisodes: data.number_of_episodes || 0,
        totalSeasons: data.number_of_seasons || 0,
      });
    }

    if (source === "anime") {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime/${id}/full`
      );
      const data = await res.json();
      const anime = data.data;

      return NextResponse.json({
        title: anime.title,
        synopsis: anime.synopsis,
        poster: anime.images?.jpg?.large_image_url || null,
        backdrop: null,
        genres:
          anime.genres?.map((g: any) => g.name) || [],
        rating: anime.score
          ? parseFloat(anime.score.toFixed(1))
          : null,
        status: anime.status,
        firstAired: anime.aired?.from
          ? anime.aired.from.split("T")[0]
          : null,
        network: anime.studios?.[0]?.name || null,
        totalEpisodes: anime.episodes || 0,
        totalSeasons: null,
      });
    }

    return NextResponse.json(
      { error: "Invalid source" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}