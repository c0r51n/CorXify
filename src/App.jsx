import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  seek,
} from "./spotify";
import { Play, Pause, SkipBack, SkipForward, MoreVertical } from "lucide-react";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Menü schließen, wenn außerhalb geklickt wird
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Automatische Spotify-Verbindung
  useEffect(() => {
    const token = getAccessToken();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!token && !code) {
      getAuthorizationUrl().then((url) => {
        window.location.href = url;
      });
    } else if (code && !token) {
      fetchAccessToken(code).then(() => {
        window.history.replaceState({}, document.title, "/");
        loadCurrentTrack();
      });
    } else if (token) {
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
      }, 1000);
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

  async function handleSeek(e) {
    if (!track) return;
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = percent * track.duration_ms;
    await seek(newPosition);
    setProgressMs(newPosition);
  }

  return (
    <div
      style={{
        position: "relative",
        color: "#fff",
        background: "linear-gradient(180deg, #3a3d62 0%, #000 100%)",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Verschwommenes Hintergrundbild */}
      {track && (
        <img
          src={track.album.images[0].url}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(15px) brightness(0.5)",
            transform: "scale(1.0)",
            zIndex: 0,
          }}
        />
      )}

      {/* Inhalt */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          textAlign: "center",
          backdropFilter: "blur(5px)",
        }}
      >
        {/* Menü */}
        <div
          ref={menuRef}
          style={{ position: "absolute", top: 20, right: 20, cursor: "pointer" }}
        >
          <MoreVertical size={26} onClick={() => setMenuOpen(!menuOpen)} />
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                marginTop: 8,
                background: "rgba(20,20,20,0.95)",
                borderRadius: 10,
                padding: "8px 12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                zIndex: 3,
              }}
            >
              <p
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
                style={{
                  margin: 0,
                  cursor: "pointer",
                  fontSize: "0.95em",
                  color: "#fff",
                }}
              >
                Neu verbinden
              </p>
            </div>
          )}
        </div>

        {track ? (
          <>
            <img
              src={track.album.images[0].url}
              alt="cover"
              width={220}
              style={{
                borderRadius: 15,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                marginBottom: 15,
              }}
            />
            <h2>{track.name}</h2>
            <p>{track.artists.map((a) => a.name).join(", ")}</p>

            {/* Progress-Bar */}
            <div
              style={{
                width: "80%",
                margin: "10px auto",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: "5px",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={handleSeek}
              >
                <div
                  style={{
                    width: `${(progressMs / track.duration_ms) * 100}%`,
                    height: "100%",
                    background: "white",
                    borderRadius: "5px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${(progressMs / track.duration_ms) * 100}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "white",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9em",
                  opacity: 0.8,
                  marginTop: 5,
                }}
              >
                <span>{formatTime(progressMs)}</span>
                <span>{formatTime(track.duration_ms)}</span>
              </div>
            </div>

            {/* Steuerung */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "25px",
                marginTop: 10,
              }}
            >
              <SkipBack size={32} onClick={previousTrack} style={{ cursor: "pointer" }} />
              <motion.div
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={32} color="#000" />
                ) : (
                  <Play size={32} color="#000" />
                )}
              </motion.div>
              <SkipForward size={32} onClick={nextTrack} style={{ cursor: "pointer" }} />
            </div>

            {/* Herz-Button */}
            <motion.button
              onClick={handleLike}
              animate={{ scale: isLiked ? [1, 1.3, 1] : [1, 0.8, 1] }}
              transition={{ duration: 0.3 }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.8em",
                color: isLiked ? "red" : "white",
                marginTop: "25px",
              }}
            >
              {isLiked ? "❤️" : "🤍❌"}
            </motion.button>
          </>
        ) : (
          <p>Keine Wiedergabe gefunden.</p>
        )}
      </div>
    </div>
  );
}

export default App;
