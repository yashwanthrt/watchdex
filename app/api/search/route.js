import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fetchWithRetry(url, retries = 2, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) return data;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (_) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return null;
}

async function getAnimeWithAllSeasons(malId) {
  try {
    const detail = await fetchWithRetry(
      `https://api.jikan.moe/v4/anime/${malId}/full`
    );
    if (!detail) return null;
    const anime = detail.data;

    let totalEpisodes = anime.episodes || 0;
    const seenIds = new Set([malId]);
    const queue = [];

    const extractSequels = (relations) => {
      for (const rel of relations || []) {
        if (rel.relation === "Sequel") {
          for (const entry of rel.entry) {
            if (
              entry.type === "anime" &&
              !seenIds.has(entry.mal_id)
            ) {
              queue.push(entry.mal_id);
              seenIds.add(entry.mal_id);
            }
          }
        }
      }
    };

    extractSequels(anime.relations);

    console.log(
      "Base eps for",
      anime.title,
      ":",
      anime.episodes,
      "| Initial queue:",
      [...queue]
    );

    let safetyLimit = 20;

    while (queue.length > 0 && safetyLimit > 0) {
      safetyLimit--;
      const id = queue.shift();
      await new Promise((r) => setTimeout(r, 1200));

      const seqDetail = await fetchWithRetry(
        `https://api.jikan.moe/v4/anime/${id}/full`,
        3,
        2000
      );

      if (!seqDetail) {
        console.log("No data for ID:", id);
        continue;
      }

      const seqAnime = seqDetail.data;

      console.log(
        "Sequel",
        seqAnime.title,
        "eps:",
        seqAnime.episodes,
        "| Its sequels:",
        seqAnime.relations
          ?.filter((r) => r.relation === "Sequel")
          .flatMap((r) =>
            r.entry.map((e) => e.mal_id)
          )
      );

      if (seqAnime.episodes) {
        totalEpisodes += seqAnime.episodes;
      }

      extractSequels(seqAnime.relations);
    }

    console.log(
      "Final total eps for",
      anime.title,
      ":",
      totalEpisodes
    );

    return {
      id: anime.mal_id,
      title: anime.title,
      poster: anime.images.jpg.large_image_url,
      type: "Anime",
      status: anime.status || "Unknown",
      score: anime.score || 0,
      source: "anime",
      totalEpisodes,
    };
  } catch (e) {
    console.log("Error in getAnimeWithAllSeasons:", e);
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "tv";

    if (!query) return NextResponse.json([]);

    if (!TMDB_API_KEY) {
      return NextResponse.json([]);
    }

    const endpoint =
      type === "anime"
        ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`
        : `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    // ---------- ANIME ----------
    if (type === "anime") {
      const basicResults = data.data || [];

      const top5 = basicResults.slice(0, 5);
      const rest = basicResults.slice(5);

      const top5Full = await Promise.all(
        top5.map((item) =>
          getAnimeWithAllSeasons(item.mal_id)
        )
      );

      const restBasic = rest.map((item) => ({
        id: item.mal_id,
        title: item.title,
        poster: item.images.jpg.large_image_url,
        type: "Anime",
        status: item.status || "Unknown",
        score: item.score || 0,
        source: "anime",
        totalEpisodes: item.episodes || 0,
      }));

      const anime = [
        ...top5Full.filter(Boolean),
        ...restBasic,
      ];

      return NextResponse.json(anime);
    }

    // ---------- TV SHOWS ----------
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
      const aExact =
        aTitle === lowerQuery
          ? 1000
          : aTitle.includes(lowerQuery)
          ? 500
          : 0;
      const bExact =
        bTitle === lowerQuery
          ? 1000
          : bTitle.includes(lowerQuery)
          ? 500
          : 0;
      return (
        bExact - aExact ||
        b.popularity - a.popularity ||
        b.vote - a.vote
      );
    });

    return NextResponse.json(shows);
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json([]);
  }
}