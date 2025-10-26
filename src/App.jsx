import React, { useState, useEffect } from "react";
import {
  getAuthorizationUrl,
  fetchAccessToken,
  getAccessToken,
  logout
} from "./auth";
import {
  getCurrentPlayback,
  play,
  pause,
  nextTrack,
  previousTrack,
  checkIfTrackIsSaved,
  saveTrack,
  removeTrack
} from "./spotify";

import { Play, Pause, SkipBack, SkipForward, Heart } from "lucide-react";

function App() {
  const [playback, setPlayback] = useState({
    track: null,
    isPlaying: false,
    progressMs: 0,
    isLiked: false
  });

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [heartPulse, setHeartPulse] = useState(false);

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
        const saved = await checkIfTrackIsSaved(data.item.id);
        setPlayback({
          track: data.item,
          isPlaying: data.is_playing,
          progressMs: isSeeking ? seekPosition : data.progress_ms,
          isLiked: saved
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePlayPause() {
    try {
      if (playback.isPlaying) await pause();
      else await play();
      setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLike() {
    if (!playback.track) return;
    try {
      setHeartPulse(true);
      if (playback.isLiked) {
        await removeTrack(playback.track.id);
        setPlayback(prev => ({ ...prev, isLiked: false }));
      } else {
        await saveTrack(playback.track.id);
        setPlayback(prev => ({ ...prev, isLiked: true }));
      }

      setTimeout(async () => {
        const saved = await checkIfTrackIsSaved(playback.track.id);
        setPlayback(prev => ({ ...prev, isLiked: saved }));
        setHeartPulse(false);
      }, 1000);
    } catch (err) {
      console.error("Fehler beim Liken:", err);
      setHeartPulse(false);
    }
  }

  async function handleSeekStart() {
    setIsSeeking(true);
  }

  async function handleSeekChange(e) {
    setSeekPosition(parseInt(e.target.value, 10));
  }

  async function handleSeekEnd(e) {
    setIsSeeking(false);
    const newPosition = parseInt(e.target.value, 10);

    try {
      const token = getAccessToken();
      await fetch(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      setPlayback(prev => ({ ...prev, progressMs: newPosition }));
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
        padding: 20,
        fontFamily: "sans-serif",
        color: "#fff",
        background: "#121212",
        minHeight: "100vh"
      }}
    >
      <h1>CorXify</h1>

      {!getAccessToken() ? (
        <button
          onClick={async () =>
            (window.location.href = await getAuthorizationUrl())
          }
          style={{
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 8,
            cursor: "pointer",
            background: "#1DB954",
            color: "#fff",
            border: "none"
          }}
        >
          Mit Spotify verbinden
        </button>
      ) : (
        <>
          {playback.track ? (
            <div style={{ textAlign: "center" }}>
              <img
                src={playback.track.album.images[0].url}
                alt="cover"
                width={200}
                style={{ borderRadius: 10 }}
              />
              <h2>{playback.track.name}</h2>
              <p>{playback.track.artists.map(a => a.name).join(", ")}</p>

              {/* Progress + Slider */}
              <div style={{ width: "80%", margin: "10px auto" }}>
                <input
                  type="range"
                  min="0"
                  max={playback.track.duration_ms}
                  value={isSeeking ? seekPosition : playback.progressMs}
                  onMouseDown={handleSeekStart}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={handleSeekStart}
                  onTouchMove={handleSeekChange}
                  onTouchEnd={handleSeekEnd}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    accentColor: "#1DB954",
                    touchAction: "none"
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9em",
                    opacity: 0.8
                  }}
                >
                  <span>{formatTime(playback.progressMs)}</span>
                  <span>{formatTime(playback.track.duration_ms)}</span>
                </div>
              </div>

              {/* Steuerungsbuttons */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "center",
                  gap: 20
                }}
              >
                <button
                  onClick={previousTrack}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <SkipBack size={32} />
                </button>

                <button
                  onClick={handlePlayPause}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {playback.isPlaying ? (
                    <Pause size={36} />
                  ) : (
                    <Play size={36} />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <SkipForward size={32} />
                </button>
              </div>

              {/* Herz */}
              <div style={{ marginTop: 15 }}>
                <button
                  onClick={handleLike}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 32,
                    color: playback.isLiked ? "red" : "white",
                    transform: heartPulse ? "scale(1.3)" : "scale(1)",
                    transition: "transform 0.3s"
                  }}
                >
                  <Heart size={32} />
                </button>
              </div>
            </div>
          ) : (
            <p>Keine Wiedergabe gefunden.</p>
          )}

          {/* Neu verbinden */}
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              background: "#1DB954",
              color: "#fff",
              border: "none"
            }}
            onClick={() => {
              logout();
              window.location.reload();
            }}
          >
            Neu verbinden
          </button>
        </>
      )}
    </div>
  );
}

export default App;
