import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function searchAnimeAniList(query) {
  const graphql = JSON.stringify({
    query: `
      query ($search: String) {
        Page(perPage: 20) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english }
            episodes
            coverImage { large }
            status
            averageScore
          }
        }
      }
    `,
    variables: { search: query },
  });

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: graphql,
    });
    const data = await res.json();
    if (data.errors) {
      console.error("AniList error:", data.errors);
      return [];
    }
    return data.data?.Page?.media || [];
  } catch (e) {
    console.error("AniList fetch error:", e);
    return [];
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "tv";

    if (!query) return NextResponse.json([]);

    // ANIME
    if (type === "anime") {
      const animeResults = await searchAnimeAniList(query);
      const formatted = animeResults.map((item) => ({
        id: item.id,
        title: item.title?.romaji || item.title?.english || "Unknown",
        poster: item.coverImage?.large || "/placeholder.jpg",
        type: "Anime",
        status: item.status || "Unknown",
        score: item.averageScore || 0,
        source: "anime",
        totalEpisodes: item.episodes || 0,
      }));
      return NextResponse.json(formatted);
    }

    // TV SHOWS
    if (!TMDB_API_KEY) return NextResponse.json([]);

    const endpoint = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    const basicShows = data.results?.slice(0, 20) || [];

    const shows = await Promise.all(
      basicShows.map(async (item) => {
        let totalEpisodes = 0;
        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/tv/${item.id}?api_key=${TMDB_API_KEY}`
          );
          const detail = await detailRes.json();
          totalEpisodes = detail.number_of_episodes || 0;
        } catch (_) {}
        return {
          id: item.id,
          title: item.name,
          poster: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : "/placeholder.jpg",
          type: "TV",
          status: item.status || "Unknown",
          popularity: item.popularity || 0,
          vote: item.vote_average || 0,
          source: "tv",
          totalEpisodes,
        };
      })
    );

    const lowerQuery = query.toLowerCase();
    shows.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aExact = aTitle === lowerQuery ? 1000 : aTitle.includes(lowerQuery) ? 500 : 0;
      const bExact = bTitle === lowerQuery ? 1000 : bTitle.includes(lowerQuery) ? 500 : 0;
      return bExact - aExact || b.popularity - a.popularity || b.vote - a.vote;
    });

    return NextResponse.json(shows);
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json([]);
  }
}