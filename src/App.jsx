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
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
} from "lucide-react";

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

  async function handleSeek(event) {
    if (!track) return;
    const newProgress = Number(event.target.value);
    setProgressMs(newProgress);

    try {
      await fetch("https://api.spotify.com/v1/me/player/seek?position_ms=" + newProgress, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + getAccessToken(),
        },
      });
    } catch (err) {
      console.error("Fehler beim Spulen:", err);
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
        background: "linear-gradient(180deg, #3a3d62 0%, #000000 100%)",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 🔥 Verschwommener Hintergrund */}
      {track && (
        <div
          style={{
            backgroundImage: `url(${track.album.images[0].url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px)",
            transform: "scale(1)",
            opacity: 0.3,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
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
            {/* 🎵 Cover wieder kleiner */}
            <img
              src={track.album.images[0].url}
              alt="cover"
              width={260}
              style={{
                borderRadius: 20,
                boxShadow: "0 0 25px rgba(0,0,0,0.5)",
              }}
            />
            <h2 style={{ marginTop: 20 }}>{track.name}</h2>
            <p style={{ opacity: 0.8 }}>{track.artists.map((a) => a.name).join(", ")}</p>

            {/* 🎚 Fortschrittsbalken (weiß & rund) */}
            <div style={{ width: "90%", margin: "15px auto" }}>
              <input
                type="range"
                value={progressMs}
                max={track.duration_ms}
                onChange={handleSeek}
                style={{
                  width: "100%",
                  height: 6,
                  borderRadius: 10,
                  appearance: "none",
                  background: "white",
                  cursor: "pointer",
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

            {/* 🎛 Buttons */}
            <div
              style={{
                marginTop: 25,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 50,
              }}
            >
              <button
                onClick={previousTrack}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <SkipBack size={36} />
              </button>

              <button
                onClick={handlePlayPause}
                style={{
                  background: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 90,
                  height: 90,
                  color: "black",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 25px rgba(0,0,0,0.5)",
                }}
              >
                {isPlaying ? <Pause size={44} /> : <Play size={44} />}
              </button>

              <button
                onClick={nextTrack}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <SkipForward size={36} />
              </button>
            </div>

            {/* ❤️ Like */}
            <div style={{ marginTop: 20 }}>
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
                <Heart
                  fill={isLiked ? "red" : "none"}
                  color={isLiked ? "red" : "white"}
                  size={36}
                />
              </button>
            </div>

            {/* 🔄 Logout */}
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
    </div>
  );
}

export default App;
