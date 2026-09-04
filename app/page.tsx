"use client";

import { useState, useEffect, useRef } from "react";

const POSTER_W = 160;
const POSTER_H = 240;

// Mobile detection hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function ProgressBar({
  watched,
  total,
}: {
  watched: number;
  total: number;
}) {
  const pct =
    total > 0 ? Math.min((watched / total) * 100, 100) : 0;
  return (
    <div
      style={{
        width: "100%",
        height: "3px",
        background: "var(--surface-3)",
        borderRadius: "2px",
        marginTop: "6px",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "var(--purple-primary)",
          borderRadius: "2px",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

function WatchCard({
  show,
  onComplete,
  onDelete,
  onSetEpisode,
  onDrop,
  onStartWatching,
  showEpDiff = false,
  section,
  dragging = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onClick,
  isSelected,
}: {
  show: any;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onSetEpisode: (id: number, ep: number) => void;
  onDrop: (id: number) => void;
  onStartWatching: (id: number) => void;
  showEpDiff?: boolean;
  // "Completed" | "Watchlist" | "Ongoing" | "Dropped" — controls which actions are shown
  section?: "Completed" | "Watchlist" | "Ongoing" | "Dropped";
  dragging?: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  isSelected: boolean;
}) {
  const [epInput, setEpInput] = useState(
    String(show.episodes_watched)
  );
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset overlay when the show changes
  useEffect(() => {
    setOverlayOpen(false);
  }, [show.id]);
  const epDiff =
    show.total_episodes > 0
      ? show.total_episodes - show.episodes_watched
      : null;

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () =>
      mq.removeEventListener("change", handler);
  }, []);

  const overlayVisible = isTouch
    ? overlayOpen
    : undefined; // hover handles desktop via CSS

  // Close overlay when tapping outside the card (touch only)
  useEffect(() => {
    if (!isTouch || !overlayOpen) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOverlayOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isTouch, overlayOpen]);

  const handlePosterClick = () => {
    if (isTouch) {
      if (overlayOpen) {
        setOverlayOpen(false);
        onClick();
      } else {
        setOverlayOpen(true);
      }
    } else {
      onClick();
    }
  };

  const closeOverlay = () => setOverlayOpen(false);

  const handleDragStart = () => {
    closeOverlay();
    onDragStart();
  };

  return (
    <>
      <style>{`
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spin {
          -moz-appearance: textfield;
        }
      `}</style>
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragEnd={onDragEnd}
      style={{
        width: `${POSTER_W}px`,
        flexShrink: 0,
        opacity: dragging ? 0.4 : 1,
        cursor: "grab",
        transition: "opacity 0.2s, transform 0.2s",
        transform: isSelected ? "scale(1.03)" : "scale(1)",
      }}
    >
      <div
        className="overflow-hidden relative group"
        style={{
          width: `${POSTER_W}px`,
          borderRadius: "12px",
          border: isSelected
            ? "2px solid var(--purple-primary)"
            : dragging
            ? "2px dashed var(--purple-primary)"
            : "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: isSelected
            ? "0 0 20px var(--purple-glow)"
            : "none",
        }}
      >
        <img
          src={show.poster_url}
          alt={show.title}
          onClick={handlePosterClick}
          style={{
            width: `${POSTER_W}px`,
            height: `${POSTER_H}px`,
            minWidth: `${POSTER_W}px`,
            display: "block",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200 ${
            isTouch
              ? overlayOpen
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ background: "rgba(10,10,20,0.92)", pointerEvents: dragging ? "none" : (isTouch ? (overlayOpen ? "auto" : "none") : "auto") }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Episode controls — only for Ongoing section */}
          {section === "Ongoing" && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                className="no-spin"
                type="number"
                min="0"
                value={epInput}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = epInput === "0" && val.startsWith("0")
                    ? val.replace(/^0+/, "") || "0"
                    : val;
                  setEpInput(next);
                }}
                style={{
                  width: "52px",
                  padding: "4px 0",
                  fontSize: "12px",
                  textAlign: "center",
                  color: "white",
                  background: "var(--surface-3)",
                  border:
                    "1px solid var(--purple-primary)",
                  borderRadius: "8px",
                  outline: "none",
                  appearance: "textfield",
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const val = parseInt(epInput);
                  if (!isNaN(val) && val >= 0) {
                    onSetEpisode(show.id, val);
                    if (isTouch) closeOverlay();
                  }
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "white",
                  background: "var(--purple-primary)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Set
              </button>
            </div>
          )}

          {/* Completed section: only Remove */}
          {section === "Completed" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(show.id);
                if (isTouch) closeOverlay();
              }}
              style={{
                width: "120px",
                padding: "6px 0",
                fontSize: "11px",
                fontWeight: 600,
                color: "white",
                background: "#b91c1c",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              ✕ Remove
            </button>
          )}

          {/* Watchlist section: Complete + Ongoing */}
          {section === "Watchlist" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(show.id);
                  if (isTouch) closeOverlay();
                }}
                style={{
                  width: "120px",
                  padding: "6px 0",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "white",
                  background: "#16a34a",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ✓ Complete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartWatching(show.id);
                  if (isTouch) closeOverlay();
                }}
                style={{
                  width: "120px",
                  padding: "6px 0",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "white",
                  background: "var(--purple-primary)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ▶ Ongoing
              </button>
            </>
          )}

          {/* Ongoing section: Complete (if not fully watched) + ongoing progress indicator */}
          {section === "Ongoing" && (
            <>
              {(show.watch_status !== "completed" ||
                show.episodes_watched < show.total_episodes) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(show.id);
                    if (isTouch) closeOverlay();
                  }}
                  style={{
                    width: "120px",
                    padding: "6px 0",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "white",
                    background: "#16a34a",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  ✓ Complete
                </button>
              )}
            </>
          )}

          {/* Dropped section: Remove */}
          {section === "Dropped" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(show.id);
                if (isTouch) closeOverlay();
              }}
              style={{
                width: "120px",
                padding: "6px 0",
                fontSize: "11px",
                fontWeight: 600,
                color: "white",
                background: "#b91c1c",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              ✕ Remove
            </button>
          )}
        </div>
      </div>

      <div
        style={{ marginTop: "10px", padding: "0 2px" }}
        onClick={onClick}
      >
        <h3
          style={{
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "34px",
            color: "var(--foreground)",
            cursor: "pointer",
          }}
        >
          {show.title}
        </h3>

        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "4px",
          }}
        >
          {show.episodes_watched} /{" "}
          {show.total_episodes > 0
            ? show.total_episodes
            : "?"}{" "}
          eps
          {showEpDiff &&
            epDiff !== null &&
            epDiff > 0 && (
              <span
                style={{
                  marginLeft: "6px",
                  color: "var(--purple-light)",
                  fontWeight: 600,
                }}
              >
                ({epDiff} left)
              </span>
            )}
        </div>

        <ProgressBar
          watched={show.episodes_watched}
          total={show.total_episodes}
        />

        <div style={{ marginTop: "6px" }}>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor:
                show.watch_status === "completed"
                  ? "#16a34a"
                  : show.watch_status === "watching"
                  ? "var(--purple-primary)"
                  : show.watch_status === "dropped"
                  ? "#b45309"
                  : "var(--surface-3)",
              color: "white",
            }}
          >
            {show.watch_status}
          </span>
        </div>
      </div>
    </div>
    </>
  );
}

function DetailPanel({
  show,
  onClose,
}: {
  show: any;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `/api/show-detail?source=${show.source}&id=${show.source_id}`
        );
        const data = await res.json();
        setDetail(data);
      } catch (_) {}
      finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [show.source, show.source_id]);

  const pct =
    show.total_episodes > 0
      ? Math.min(
          (show.episodes_watched / show.total_episodes) * 100,
          100
        )
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--surface)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        {detail?.backdrop && (
          <div
            style={{
              width: "100%",
              height: "240px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img
              src={detail.backdrop}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, transparent 40%, var(--surface) 100%)",
              }}
            />
          </div>
        )}

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "40px",
              }}
            >
              Loading...
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {/* Poster */}
              <img
                src={detail?.poster || show.poster_url}
                alt={show.title}
                style={{
                  width: "140px",
                  height: "210px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  flexShrink: 0,
                  border: "1px solid var(--border)",
                  marginTop: detail?.backdrop
                    ? "-80px"
                    : "0",
                  position: "relative",
                  zIndex: 1,
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--foreground)",
                    marginBottom: "8px",
                  }}
                >
                  {detail?.title || show.title}
                </h2>

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "12px",
                    alignItems: "center",
                  }}
                >
                  {detail?.rating && (
                    <span
                      style={{
                        background: "var(--purple-dark)",
                        color: "var(--purple-light)",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        border:
                          "1px solid var(--purple-primary)",
                      }}
                    >
                      ★ {detail.rating}
                    </span>
                  )}
                  {detail?.status && (
                    <span
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {detail.status}
                    </span>
                  )}
                  {detail?.firstAired && (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {new Date(
                        detail.firstAired
                      ).getFullYear()}
                    </span>
                  )}
                  {detail?.network && (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {detail.network}
                    </span>
                  )}
                  {detail?.totalSeasons && (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {detail.totalSeasons} season
                      {detail.totalSeasons > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {/* Genres */}
                {detail?.genres?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {detail.genres.map((g: string) => (
                      <span
                        key={g}
                        style={{
                          background: "var(--surface-3)",
                          color: "var(--purple-light)",
                          fontSize: "11px",
                          padding: "2px 10px",
                          borderRadius: "999px",
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                {detail?.synopsis && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    {detail.synopsis}
                  </p>
                )}

                {/* Progress */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                      }}
                    >
                      Your Progress
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--purple-light)",
                        fontWeight: 600,
                      }}
                    >
                      {show.episodes_watched} /{" "}
                      {show.total_episodes > 0
                        ? show.total_episodes
                        : "?"}{" "}
                      eps
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "var(--surface-3)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--purple-dark), var(--purple-primary))",
                        borderRadius: "3px",
                        transition: "width 0.4s",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {pct.toFixed(0)}% complete
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor:
                          show.watch_status === "completed"
                            ? "#16a34a"
                            : show.watch_status ===
                              "watching"
                            ? "var(--purple-primary)"
                            : show.watch_status ===
                              "dropped"
                            ? "#b45309"
                            : "var(--surface-3)",
                        color: "white",
                      }}
                    >
                      {show.watch_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            color: "white",
            fontSize: "16px",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("tv");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [watchlistLoading, setWatchlistLoading] =
    useState(true);
  const [selectedItem, setSelectedItem] =
    useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [detailShow, setDetailShow] =
    useState<any>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("Completed");
  const [showMobileHome, setShowMobileHome] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );
    const cat = params.get("category");
    if (cat === "anime" || cat === "tv") {
      setCategory(cat);
      setShowMobileHome(false);
    } else {
      setShowMobileHome(true);
    }
  }, []);

  const isSearching = query.trim().length > 0;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setResults([]);
    setQuery("");
    setSelectedItem(null);
    setActiveSection("Completed");
    setShowMobileHome(false);
    // Update URL so a refresh lands on the right page
    const url = new URL(window.location.href);
    url.searchParams.set("category", cat);
    window.history.pushState({}, "", url.toString());
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWatchlist(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications((prev) => [...prev, ...data]);
        fetchWatchlist();
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchWatchlist();
    fetchNotifications();
    const interval = setInterval(
      fetchNotifications,
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
    }, []);
    useEffect(() => {
    if (!showNotifications) return;
    const handler = () => setShowNotifications(false);
    document.addEventListener("click", handler);
    return () =>
      document.removeEventListener("click", handler);
  }, [showNotifications]);

  const handleDragEnd = async (list: any[]) => {
    setDraggingId(null);
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    ) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const reordered = [...list];
    const dragIdx = reordered.findIndex(
      (s) => s.id === dragItem.current
    );
    const overIdx = reordered.findIndex(
      (s) => s.id === dragOverItem.current
    );

    if (dragIdx === -1 || overIdx === -1) return;

    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(overIdx, 0, moved);

    const updated = watchlist.map((s) => {
      const newIdx = reordered.findIndex(
        (r) => r.id === s.id
      );
      return newIdx !== -1
        ? { ...s, sort_order: newIdx }
        : s;
    });
    setWatchlist(updated);

    await Promise.all(
      reordered.map((show, idx) =>
        fetch(`/api/watchlist/${show.id}/reorder`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sort_order: idx }),
        })
      )
    );

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSearch = async (
    value: string,
    selectedType = category
  ) => {
    setQuery(value);
    setSelectedItem(null);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(
          value
        )}&type=${selectedType}`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (status: string) => {
    if (!selectedItem) return;
    // Check if already in watchlist — update status instead of adding
    const existing = watchlist.find(
      (s) =>
        s.source === selectedItem.source &&
        String(s.source_id) === String(selectedItem.id)
    );
    if (existing) {
      // Update existing entry's status
      try {
        await fetch(`/api/watchlist/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watch_status: status,
            episodes_watched: status === "watching" ? 0 : existing.episodes_watched,
          }),
        });
        setSelectedItem(null);
        fetchWatchlist();
      } catch (error) {
        console.error(error);
      }
      return;
    }
    try {
      const res = await fetch("/api/add-show", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItem.id,
          title: selectedItem.title,
          poster: selectedItem.poster,
          type: selectedItem.type,
          source: selectedItem.source,
          status: selectedItem.status,
          watch_status: status,
          totalEpisodes:
            selectedItem.totalEpisodes || 0,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        alert("Already in your watchlist");
      } else if (data.error) {
        alert("Failed to add show");
      } else {
        setSelectedItem(null);
        fetchWatchlist();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add show");
    }
  };

  const handleToggleWatchlist = async (item: any) => {
    const existing = watchlist.find(
      (s) =>
        s.source === item.source &&
        String(s.source_id) === String(item.id)
    );
    if (existing) {
      // Remove from watchlist
      try {
        await fetch(`/api/watchlist/${existing.id}`, {
          method: "DELETE",
        });
        fetchWatchlist();
      } catch (error) {
        console.error(error);
      }
    } else {
      // Add to watchlist (planned status)
      try {
        await fetch("/api/add-show", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            source: item.source,
            status: item.status,
            watch_status: "planned",
            totalEpisodes: item.totalEpisodes || 0,
          }),
        });
        fetchWatchlist();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSetEpisode = async (
    id: number,
    ep: number
  ) => {
    try {
      await fetch(`/api/watchlist/${id}/episode`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ set: ep }),
      });
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await fetch(
        `/api/watchlist/${id}/complete`,
        { method: "PATCH" }
      );
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDropStatus = async (id: number) => {
    try {
      await fetch(`/api/watchlist/${id}/drop`, {
        method: "PATCH",
      });
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartWatching = async (id: number) => {
    try {
      await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watch_status: "watching", episodes_watched: 0 }),
      });
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/watchlist/${id}`, {
        method: "DELETE",
      });
      if (detailShow?.id === id) setDetailShow(null);
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  const filterByCategory = (list: any[]) =>
    list.filter((s) =>
      category === "anime"
        ? s.type === "Anime"
        : s.type !== "Anime"
    );

  const completed = filterByCategory(
    watchlist.filter(
      (s) => s.watch_status === "completed"
    )
  );
  const watching = filterByCategory(
    watchlist.filter(
      (s) => s.watch_status === "watching"
    )
  );
  const planned = filterByCategory(
    watchlist.filter(
      (s) => s.watch_status === "planned"
    )
  );
  const dropped = filterByCategory(
    watchlist.filter(
      (s) => s.watch_status === "dropped"
    )
  );

  const hasAny =
    completed.length > 0 ||
    watching.length > 0 ||
    planned.length > 0 ||
    dropped.length > 0;

  // Auto-select the first non-empty section whenever the watchlist data changes
  useEffect(() => {
    if (watchlistLoading) return;
    if (completed.length > 0 && activeSection !== "Completed") setActiveSection("Completed");
    else if (watching.length > 0 && activeSection === "Completed" && completed.length === 0) setActiveSection("Ongoing");
    else if (planned.length > 0 && activeSection === "Completed" && completed.length === 0 && watching.length === 0) setActiveSection("Watchlist");
    else if (dropped.length > 0 && activeSection === "Completed" && completed.length === 0 && watching.length === 0 && planned.length === 0) setActiveSection("Dropped");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistLoading, completed.length, watching.length, planned.length, dropped.length]);

  const renderSection = (
    title: string,
    list: any[],
    showEpDiff = false,
    emptyMessage?: string,
    section?: "Completed" | "Watchlist" | "Ongoing" | "Dropped"
  ) => (
    <section style={{ marginTop: "48px" }}>
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: "20px",
          color: "white",
          letterSpacing: "0.5px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {title}
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            fontWeight: 400,
            background: "var(--surface-2)",
            padding: "2px 10px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
          }}
        >
          {list.length}
        </span>
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {list.length === 0 && emptyMessage ? (
          <div
            style={{
              width: "100%",
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "14px",
              border: "1px dashed var(--border)",
              borderRadius: "12px",
              background: "var(--surface-2)",
            }}
          >
            {emptyMessage}
          </div>
        ) : null}
        {list.map((show: any) => (
          <WatchCard
            key={show.id}
            show={show}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onSetEpisode={handleSetEpisode}
            onDrop={handleDropStatus}
            onStartWatching={handleStartWatching}
            showEpDiff={showEpDiff}
            section={section}
            dragging={draggingId === show.id}
            isSelected={selectedCardId === show.id}
            onDragStart={() => {
              dragItem.current = show.id;
              setDraggingId(show.id);
            }}
            onDragOver={() => {
              dragOverItem.current = show.id;
            }}
            onDragEnd={() => handleDragEnd(list)}
            onClick={() => {
              setSelectedCardId(
                selectedCardId === show.id
                  ? null
                  : show.id
              );
              setDetailShow(
                detailShow?.id === show.id
                  ? null
                  : show
              );
            }}
          />
        ))}
      </div>
    </section>
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Detail Panel */}
      {detailShow && (
        <DetailPanel
          show={detailShow}
          onClose={() => {
            setDetailShow(null);
            setSelectedCardId(null);
          }}
        />
      )}

      {/* Netflix-style top navbar */}
      <nav
        style={{
          position: "relative",
          zIndex: 100,
          display: "flex",

          background:
            "linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.85) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (isMobile) {
                setShowMobileHome(true);
                setShowMobileSearch(false);
                const url = new URL(window.location.href);
                url.searchParams.delete("category");
                window.history.pushState({}, "", url.toString());
              } else {
                window.location.href = `/?category=${category}`;
              }
            }}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                background:
                  "linear-gradient(135deg, #a78bfa, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                cursor: "pointer",
              }}
            >
              WatchDex
            </span>
          </a>

          {/* Category tabs - hidden on mobile */}
          {!isMobile && (
            <div style={{ display: "flex", gap: "4px" }}>
              {["tv", "anime"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: "6px 16px",
                    fontSize: "13px",
                    fontWeight:
                      category === cat ? 700 : 400,
                    color:
                      category === cat
                        ? "white"
                        : "var(--text-muted)",
                    background:
                      category === cat
                        ? "var(--purple-primary)"
                        : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat === "tv" ? "TV Shows" : "Anime"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Search - desktop: text input; mobile: icon button */}
          {!isMobile && (
            <input
              type="text"
              value={query}
              onChange={(e) =>
                handleSearch(e.target.value)
              }
              placeholder={`Search ${
                category === "tv" ? "TV shows" : "anime"
              }...`}
              style={{
                width: "220px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "white",
                fontSize: "13px",
                outline: "none",
              }}
            />
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setShowMobileSearch((p) => !p)}
              aria-label="Search"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "18px",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🔍
            </button>
          )}

          {/* Notification Bell */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() =>
                setShowNotifications((p) => !p)
              }
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "18px",
                position: "relative",
              }}
            >
              🔔
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background:
                      "var(--purple-primary)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "2px 6px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "48px",
                  width: "300px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  zIndex: 100,
                  overflow: "hidden",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderBottom:
                      "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "var(--purple-light)",
                    }}
                  >
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        setShowNotifications(false);
                      }}
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "13px",
                    }}
                  >
                    No new episodes
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    {notifications.map(
                      (n: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "12px",
                            padding: "12px 16px",
                            borderBottom:
                              "1px solid var(--border)",
                            alignItems: "center",
                          }}
                        >
                          {n.poster_url && (
                            <img
                              src={n.poster_url}
                              alt={n.title}
                              style={{
                                width: "36px",
                                height: "54px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color:
                                  "var(--foreground)",
                              }}
                            >
                              {n.title}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color:
                                  "var(--purple-light)",
                                marginTop: "2px",
                              }}
                            >
                              🎉 {n.newEpisodes} new
                              episode
                              {n.newEpisodes > 1
                                ? "s"
                                : ""}{" "}
                              dropped!
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color:
                                  "var(--text-muted)",
                                marginTop: "2px",
                              }}
                            >
                              Now at{" "}
                              {n.totalEpisodes} eps
                              total
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile search bar - shown when search icon is tapped */}
      {isMobile && showMobileSearch && (
        <div
          style={{
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 16px",
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`Search ${category === "tv" ? "TV shows" : "anime"}...`}
            autoFocus
            style={{
              width: "100%",
              background: "var(--surface-3)",
              border: "1px solid var(--purple-primary)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "white",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Mobile homepage overlay - TV Shows / Anime selection */}
      {isMobile && showMobileHome && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: "64px", // below navbar
            background: "var(--background)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            zIndex: 50,
          }}
        >
          <button
            type="button"
            onClick={() => handleCategoryChange("tv")}
            style={{
              width: "80%",
              maxWidth: "320px",
              padding: "20px",
              fontSize: "18px",
              fontWeight: 700,
              color: "white",
              background: "var(--purple-primary)",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            📺 TV Shows
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("anime")}
            style={{
              width: "80%",
              maxWidth: "320px",
              padding: "20px",
              fontSize: "18px",
              fontWeight: 700,
              color: "white",
              background: "var(--purple-primary)",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            🎌 Anime
          </button>
        </div>
      )}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 24px",
          // On mobile, hide the main content when the home overlay is shown
          display: isMobile && showMobileHome ? "none" : undefined,
        }}
      >
        {loading && (
          <div
            style={{
              marginTop: "40px",
              color: "var(--text-muted)",
            }}
          >
            Searching...
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <section style={{ marginTop: "32px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "white",
              }}
            >
              Search Results
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                paddingBottom: "32px",
              }}
            >
              {results.map((item: any) => {
                const isSelected =
                  selectedItem?.id === item.id &&
                  selectedItem?.source ===
                    item.source;
                const isInWatchlist = watchlist.some(
                  (s) =>
                    s.source === item.source &&
                    String(s.source_id) === String(item.id)
                );

                return (
                  <div
                    key={`${item.source}-${item.id}`}
                    style={{
                      width: `${POSTER_W}px`,
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {/* Card body - clickable to select */}
                    <div
                      style={{
                        width: `${POSTER_W}px`,
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: isSelected
                          ? "2px solid var(--purple-primary)"
                          : "1px solid var(--border)",
                        boxShadow: isSelected
                          ? "0 0 20px var(--purple-glow)"
                          : "none",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedItem(
                          isSelected ? null : item
                        )
                      }
                    >
                      <img
                        src={item.poster}
                        alt={item.title}
                        style={{
                          width: `${POSTER_W}px`,
                          height: `${POSTER_H}px`,
                          minWidth: `${POSTER_W}px`,
                          display: "block",
                          objectFit: "cover",
                        }}
                      />

                      {/* Small subtle Drop icon in bottom-right corner — only shown when poster is selected */}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd("dropped");
                          }}
                          aria-label="Drop"
                          title="Drop"
                          style={{
                            position: "absolute",
                            bottom: "4px",
                            right: "4px",
                            width: "20px",
                            height: "20px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "white",
                            background: "rgba(180,83,9,0.85)",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            zIndex: 5,
                            lineHeight: 1,
                          }}
                        >
                          ↓
                        </button>
                      )}

                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "rgba(10,10,20,0.92)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleWatchlist(item)
                            }
                            style={{
                              width: "130px",
                              padding: "8px 0",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "white",
                              background: isInWatchlist
                                ? "rgba(167,139,250,0.15)"
                                : "var(--surface-3)",
                              border: isInWatchlist
                                ? "1px solid var(--purple-primary)"
                                : "1px solid var(--border)",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            {isInWatchlist
                              ? "🔖 In Watchlist"
                              : "+ Watchlist"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAdd("watching")
                            }
                            style={{
                              width: "130px",
                              padding: "8px 0",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "white",
                              background:
                                "var(--purple-primary)",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            ▶ Ongoing
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAdd("completed")
                            }
                            style={{
                              width: "130px",
                              padding: "8px 0",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "white",
                              background: "#16a34a",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            ✓ Completed
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedItem(null)
                            }
                            style={{
                              width: "130px",
                              padding: "8px 0",
                              fontSize: "12px",
                              color:
                                "var(--text-muted)",
                              background:
                                "transparent",
                              border:
                                "1px solid var(--border)",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        padding: "0 2px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: "34px",
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        <span>{item.type}</span>
                        {item.status &&
                          item.status !==
                            "Unknown" && (
                            <span>
                              {item.status}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!loading &&
          query &&
          results.length === 0 && (
            <div
              style={{
                marginTop: "40px",
                color: "var(--text-muted)",
              }}
            >
              No results found.
            </div>
          )}

        {!isSearching && (
          <>
            {watchlistLoading && (
              <div
                style={{
                  marginTop: "40px",
                  color: "var(--text-muted)",
                }}
              >
                Loading watchlist...
              </div>
            )}

            {!watchlistLoading && !hasAny && (
              <div
                style={{
                  marginTop: "80px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                  }}
                >
                  🎬
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "8px",
                  }}
                >
                  Your watchlist is empty
                </div>
                <div style={{ fontSize: "14px" }}>
                  Search for{" "}
                  {category === "anime"
                    ? "anime"
                    : "TV shows"}{" "}
                  and add them to get started
                </div>
              </div>
            )}

          {!watchlistLoading && hasAny && (
              <>
                <div
                  className="status-buttons-container"
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "32px",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { key: "Completed", list: completed },
                    { key: "Watchlist", list: planned },
                    { key: "Ongoing", list: watching },
                    { key: "Dropped", list: dropped },
                  ]
                    .map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() =>
                          setActiveSection(s.key)
                        }
                        style={{
                          padding: "8px 20px",
                          fontSize: "13px",
                          fontWeight:
                            activeSection === s.key
                              ? 700
                              : 400,
                          color:
                            activeSection === s.key
                              ? "white"
                              : "var(--text-muted)",
                          background:
                            activeSection === s.key
                              ? "var(--purple-primary)"
                              : "var(--surface-2)",
                          border: "1px solid",
                          borderColor:
                            activeSection === s.key
                              ? "var(--purple-primary)"
                              : "var(--border)",
                          borderRadius: "999px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {s.key}
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: "11px",
                            opacity: 0.7,
                          }}
                        >
                          {s.list.length}
                        </span>
                      </button>
                    ))}
                </div>

                {activeSection === "Completed" &&
                  completed.length > 0 &&
                  renderSection("Completed", completed, false, undefined, "Completed")}

                {activeSection === "Ongoing" &&
                  watching.length > 0 &&
                  renderSection("Ongoing", watching, true, undefined, "Ongoing")}

                {activeSection === "Watchlist" &&
                  renderSection(
                    "Watchlist",
                    planned,
                    false,
                    "No items in your watchlist yet. Use the bookmark button on search results to add shows.",
                    "Watchlist"
                  )}

                {activeSection === "Dropped" &&
                  dropped.length > 0 &&
                  renderSection("Dropped", dropped, false, undefined, "Dropped")}
              </>
            )}
            </>
)}
</div>
</main>
);
}