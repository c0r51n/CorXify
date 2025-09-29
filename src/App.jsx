import React, { useState, useEffect } from "react";
import { getStoredToken, fetchAccessToken, redirectToSpotifyLogin } from "./auth";

export default function App() {
  const [token, setToken] = useState(null);
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Token aus URL oder LocalStorage holen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      fetchAccessToken(code).then(t => setToken(t));
      window.history.replaceState({}, document.title, "/");
    } else {
      const t = getStoredToken();
      if (t) setToken(t);
    }
  }, []);

  // Songdaten jede Sekunde abrufen
  useEffect(() => {
    if (!token) return;

    const fetchSong = async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          const data = await res.json();
          setTrack(data);
          setIsPlaying(data.is_playing);

          // Prüfen, ob Favorit
          if (data?.item?.id) {
            const favRes = await fetch(
              `https://api.spotify.com/v1/me/tracks/contains?ids=${data.item.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const favData = await favRes.json();
            setIsFavorite(favData[0]);
          }
        } else {
          setTrack(null); // kein Song oder Token abgelaufen
        }
      } catch (error) {
        console.error("Fehler beim Laden des Songs:", error);
        setTrack(null);
      }
    };

    fetchSong();
    const interval = setInterval(fetchSong, 1000);
    return () => clearInterval(interval);
  }, [token]);

  // Play/Pause Toggle
  const togglePlay = async () => {
    if (!track || !token) return;
    const url = `https://api.spotify.com/v1/me/player/${isPlaying ? "pause" : "play"}`;
    try {
      await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Play/Pause Fehler:", error);
    }
  };

  // Favoriten Toggle
  const toggleFavorite = async () => {
    if (!track?.item?.id || !token) return;
    const id = track.item.id;
    try {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
        method: isFavorite ? "DELETE" : "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Favoriten Fehler:", error);
    }
  };

  // Fortschrittsring-Berechnung
  const progressPercent =
    track?.item?.duration_ms && track?.progress_ms
      ? (track.progress_ms / track.item.duration_ms) * 100
      : 0;

  // Kein Token → Login-Button
  if (!token) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#121212",
        }}
      >
        <button
          onClick={redirectToSpotifyLogin}
          style={{ backgroundColor: "#1DB954", color: "#fff", fontSize: "1.2em", padding: "1em 2em" }}
        >
          Mit Spotify verbinden
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#121212",
        color: "#fff",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Obere Leiste */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>{track?.item?.name || "Kein Song"}</h2>
          <p style={{ margin: 0 }}>
            {track?.item?.artists?.map(a => a.name).join(", ") || "—"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleFavorite}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5em" }}
          >
            {isFavorite ? "❤️" : "🤍"}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5em" }}>⋮</button>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("code_verifier");
              window.location.reload();
            }}
            style={{
              background: "#ff4d4d",
              border: "none",
              borderRadius: 5,
              padding: "0.3em 0.6em",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Neu verbinden
          </button>
        </div>
      </div>

      {/* Album-Cover + Fortschrittsring */}
      <div style={{ position: "relative", width: 250, height: 250, margin: "40px 0" }}>
        <img
          src={track?.item?.album?.images?.[0]?.url || ""}
          alt="Album"
          style={{ width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#1a1a1a" }}
        />
        <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width="250" height="250">
          <circle cx="125" cy="125" r="120" stroke="#555" strokeWidth="5" fill="none" />
          <circle
            cx="125"
            cy="125"
            r="120"
            stroke="#1DB954"
            strokeWidth="5"
            fill="none"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercent / 100)}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: "1em" }}>
          {track?.progress_ms && track?.item?.duration_ms
            ? `${Math.floor(track.progress_ms / 1000 / 60)}:${String(Math.floor((track.progress_ms / 1000) % 60)).padStart(2, "0")}`
            : "0:00"}
        </div>
      </div>

      {/* Untere Steuerleiste */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <button
          onClick={async () =>
            await fetch("https://api.spotify.com/v1/me/player/previous", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        >
          ⏮️
        </button>
        <button
          onClick={togglePlay}
          style={{ fontSize: "2em", padding: "0.5em 1em", borderRadius: "50%", backgroundColor: "#fff", color: "#000" }}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        <button
          onClick={async () =>
            await fetch("https://api.spotify.com/v1/me/player/next", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}
