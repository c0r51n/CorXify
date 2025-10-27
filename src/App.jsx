import React, { useState, useEffect, useRef } from "react";
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
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [designSettings, setDesignSettings] = useState({
  blur: 15,
  useCoverBackground: true,
  coverShape: "rounded" // oder "circle"
});
const [showDesignMenu, setShowDesignMenu] = useState(false);


  // --- Verbindung + Track laden ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    async function initAuth() {
      if (!getAccessToken() && code) {
        await fetchAccessToken(code);
        window.history.replaceState({}, document.title, "/");
      }
      if (getAccessToken()) loadCurrentTrack();
      else {
        // Wenn kein Token, automatisch versuchen, URL zu holen
        const url = await getAuthorizationUrl();
        window.location.href = url;
      }
    }

    initAuth();

    const interval = setInterval(() => {
      if (getAccessToken()) loadCurrentTrack();
    }, 1000);

    // Menü außerhalb schließen
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    } catch (err) {
      console.error("Fehler beim Liken:", err);
    }
  }

  async function handleSeek(event) {
    if (!track) return;
    const newProgress = Number(event.target.value);
    setProgressMs(newProgress);

    try {
      await fetch(
        "https://api.spotify.com/v1/me/player/seek?position_ms=" + newProgress,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + getAccessToken(),
          },
        }
      );
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
        background: "linear-gradient(200deg, #3a3d62 0%, #000000 100%)",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {designSettings.useCoverBackground && track ? (
  <div
    style={{
      backgroundImage: `url(${track.album.images[0].url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: `blur(${designSettings.blur}px)`,
      transform: "scale(1.0)",
      opacity: 0.3,
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 0,
    }}
  />
) : (
  <div
    style={{
      background: "linear-gradient(135deg, #3a3d62 0%, #000000 100%)",
      filter: `blur(${designSettings.blur}px)`,
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 0,
    }}
  />
)}

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        {track ? (
          <>
            <img
              src={track.album.images[0].url}
              alt="cover"
              width={260}
              style={{
  borderRadius: designSettings.coverShape === "circle" ? "50%" : 20,
  boxShadow: "0 0 25px rgba(0,0,0,0.5)",
}}
            />
            <h2 style={{ marginTop: 20 }}>{track.name}</h2>
            <p style={{ opacity: 0.8 }}>
              {track.artists.map((a) => a.name).join(", ")}
            </p>

            {/* Progressbar */}
<div style={{ width: "90%", margin: "15px auto" }}>
  <div
    style={{
      position: "relative",
      height: 6,
      borderRadius: 10,
      background: "#444",
    }}
  >
    <div
      style={{
        position: "absolute",
        height: 6,
        borderRadius: 10,
        background: "white",
        width: `${(progressMs / track.duration_ms) * 100 || 0}%`,
      }}
    />
    {/* weißer Kreis-Punkt */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: `${(progressMs / track.duration_ms) * 100 || 0}%`,
        transform: "translate(-50%, -50%)",
        width: 14,
        height: 14,
        background: "white",
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />
    <input
      type="range"
      value={progressMs}
      max={track.duration_ms}
      onChange={handleSeek}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 6,
        opacity: 0,
        cursor: "pointer",
      }}
    />
  </div>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "0.9em",
      opacity: 0.8,
      marginTop: 4,
    }}
  >
    <span>{formatTime(progressMs)}</span>
    <span>{formatTime(track.duration_ms)}</span>
  </div>
</div>


            {/* Buttons */}
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

            {/* Herz */}
            <div style={{ marginTop: 25 }}>
              <motion.button
                onClick={handleLike}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.8em",
                  color: isLiked ? "red" : "white",
                }}
                animate={{
                  scale: isLiked ? [1, 1.3, 1] : [1, 0.8, 1],
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  fill={isLiked ? "red" : "none"}
                  color={isLiked ? "red" : "white"}
                  size={36}
                />
              </motion.button>
            </div>
          </>
        ) : (
          <p>--</p>
        )}

{/* Drei-Punkte Menü */}
<div style={{ position: "fixed", top: 20, right: 20 }} ref={menuRef}>
  <button
    onClick={() => setMenuOpen((prev) => !prev)}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "white",
      padding: 6,
    }}
  >
    <MoreVertical size={22} /> {/* kleiner gemacht */}
  </button>

  <AnimatePresence>
  {menuOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setMenuOpen(false)} // Klick außen schließt Menü
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1d1c3b 0%, #372758 100%)",
          padding: 30,
          borderRadius: 20,
          minWidth: 240,
          textAlign: "center",
          color: "white",
        }}
      >
        <button
          onClick={() => {
            logout();
            window.location.reload();
          }}
          style={{
            background: "linear-gradient(90deg, #3d4068 0%, #000000 100%)",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1em",
            marginBottom: 15,
          }}
        >
          Neu verbinden
        </button>

        <button
          onClick={() => setShowDesignMenu((prev) => !prev)}
          style={{
            background: "linear-gradient(90deg, #3d4068 0%, #000000 100%)",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1em",
          }}
        >
          Design
        </button>

        {/* Design Settings Panel */}
        <AnimatePresence>
          {showDesignMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: 20,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: 15,
                textAlign: "left",
              }}
            >
              <label style={{ display: "block", marginBottom: 8 }}>
                Hintergrund-Unschärfe: {designSettings.blur}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={designSettings.blur}
                onChange={(e) =>
                  setDesignSettings({
                    ...designSettings,
                    blur: Number(e.target.value),
                  })
                }
                style={{ width: "100%", marginBottom: 12 }}
              />

              <label style={{ display: "block", marginBottom: 8 }}>
                Hintergrund:
              </label>
              <button
                onClick={() =>
                  setDesignSettings((prev) => ({
                    ...prev,
                    useCoverBackground: !prev.useCoverBackground,
                  }))
                }
                style={{
                  width: "100%",
                  background: "#2b2b2b",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 0",
                  color: "white",
                  marginBottom: 12,
                  cursor: "pointer",
                }}
              >
                {designSettings.useCoverBackground
                  ? "Cover-Hintergrund"
                  : "Farbverlauf"}
              </button>

              <label style={{ display: "block", marginBottom: 8 }}>
                Cover-Form:
              </label>
              <button
                onClick={() =>
                  setDesignSettings((prev) => ({
                    ...prev,
                    coverShape:
                      prev.coverShape === "rounded" ? "circle" : "rounded",
                  }))
                }
                style={{
                  width: "100%",
                  background: "#2b2b2b",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 0",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {designSettings.coverShape === "rounded"
                  ? "Abgerundet"
                  : "Rund"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

</div>

      </div>
    </div>
  );
}

export default App;
