import React, { useState, useEffect } from "react";
import {
  getAuthorizationUrl,
  fetchAccessToken,
  getAccessToken,
  logout,
} from "./auth";
import {
  getCurrentPlayback,
  play,
  pause,
  nextTrack,
  previousTrack,
  checkIfTrackIsSaved,
  saveTrack,
  removeTrack,
} from "./spotify";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!getAccessToken() && code) {
      fetchAccessToken(code).then(() => {
        window.history.replaceState({}, document.title, "/");
        loadCurrentTrack();
      });
    } else if (getAccessToken()) {
      loadCurrentTrack();
    }

    const interval = setInterval(() => {
      if (getAccessToken()) loadCurrentTrack();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function loadCurrentTrack() {
    try {
      const data = await getCurrentPlayback();
      if (data && data.item) {
        setTrack(data.item);
        setIsPlaying(data.is_playing);
        setProgressMs(data.progress_ms);
        const saved = await checkIfTrackIsSaved(data.item.id);
        setIsLiked(saved);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePlayPause() {
    try {
      if (isPlaying) await pause();
      else await play();
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLike() {
    if (!track) return;
    try {
      if (isLiked) {
        await removeTrack(track.id);
        setIsLiked(false);
      } else {
        await saveTrack(track.id);
        setIsLiked(true);
      }

      setTimeout(async () => {
        const saved = await checkIfTrackIsSaved(track.id);
        setIsLiked(saved);
      }, 3500);
    } catch (err) {
      console.error("Fehler beim Liken:", err);
    }
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily: "sans-serif",
        color: "#fff",
        background: "linear-gradient(180deg, #1e1b8e 0%, #000000 100%)",
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!getAccessToken() ? (
        <button
          onClick={async () =>
            (window.location.href = await getAuthorizationUrl())
          }
          style={{
            background: "#1db954",
            color: "#fff",
            border: "none",
            borderRadius: 50,
            padding: "10px 20px",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          Mit Spotify verbinden
        </button>
      ) : track ? (
        <div style={{ textAlign: "center" }}>
          <img
            src={track.album.images[0].url}
            alt="cover"
            width={240}
            style={{
              borderRadius: 20,
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          />
          <h2 style={{ marginTop: 20 }}>{track.name}</h2>
          <p style={{ opacity: 0.8 }}>{track.artists.map((a) => a.name).join(", ")}</p>

          {/* Progress bar */}
          <div style={{ width: "80%", margin: "10px auto" }}>
            <progress
              value={progressMs}
              max={track.duration_ms}
              style={{
                width: "100%",
                appearance: "none",
                height: 6,
                borderRadius: 3,
                background: "#333",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9em",
                opacity: 0.8,
              }}
            >
              <span>{formatTime(progressMs)}</span>
              <span>{formatTime(track.duration_ms)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
            }}
          >
            <button
              onClick={previousTrack}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 60,
                height: 60,
                color: "white",
                fontSize: "1.5em",
                cursor: "pointer",
              }}
            >
              ⏮️
            </button>
            <button
              onClick={handlePlayPause}
              style={{
                background: "#961dd8",
                border: "none",
                borderRadius: "50%",
                width: 80,
                height: 80,
                color: "white",
                fontSize: "2em",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              }}
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={nextTrack}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 60,
                height: 60,
                color: "white",
                fontSize: "1.5em",
                cursor: "pointer",
              }}
            >
              ⏭️
            </button>
          </div>

          {/* Herz-Button */}
          <div style={{ marginTop: 15 }}>
            <button
              onClick={handleLike}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.8em",
                color: isLiked ? "red" : "white",
              }}
            >
              {isLiked ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Logout */}
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "6px 12px",
              cursor: "pointer",
            }}
            onClick={() => {
              logout();
              window.location.reload();
            }}
          >
            Neu verbinden
          </button>
        </div>
      ) : (
        <p>Keine Wiedergabe gefunden.</p>
      )}
    </div>
  );
}

export default App;
