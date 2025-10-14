import React, { useState, useEffect } from "react";
import { getAuthorizationUrl, fetchAccessToken, getAccessToken, logout } from "./auth";
import { getCurrentPlayback, play, pause, nextTrack, previousTrack } from "./spotify";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  // Code aus URL abholen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    async function init() {
      if (!getAccessToken() && code) {
        await fetchAccessToken(code);
        window.history.replaceState({}, document.title, "/");
      }
      if (getAccessToken()) {
        await loadCurrentTrack();
        startPolling();
      }
    }

    init();

    // Clean up bei Unmount
    return () => stopPolling();
  }, []);

  // Polling für Song-Änderungen
  let pollInterval = null;

  function startPolling() {
    if (!pollInterval) {
      pollInterval = setInterval(() => {
        loadCurrentTrack();
      }, 5000); // alle 5 Sekunden
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  async function loadCurrentTrack() {
    try {
      const data = await getCurrentPlayback();
      if (data && data.item) {
        setTrack(data.item);
        setIsPlaying(!!data.is_playing);
        setError(null);
      } else {
        setTrack(null);
      }
    } catch (err) {
      console.error(err);
      setError("Keine aktive Wiedergabe gefunden.");
    }
  }

  async function handlePlayPause() {
    try {
      if (isPlaying) {
        await pause();
        setIsPlaying(false);
      } else {
        await play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
      setError("Fehler bei Wiedergabe – bitte Spotify-App öffnen.");
    }
  }

  async function handleNext() {
    try {
      await nextTrack();
      await loadCurrentTrack();
    } catch (err) {
      console.error(err);
      setError("Nächstes Lied nicht möglich (kein aktives Gerät?).");
    }
  }

  async function handlePrevious() {
    try {
      await previousTrack();
      await loadCurrentTrack();
    } catch (err) {
      console.error(err);
      setError("Vorheriges Lied nicht möglich (kein aktives Gerät?).");
    }
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "sans-serif",
        color: "#fff",
        background: "#121212",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <h1>CorXify</h1>

      {!getAccessToken() ? (
        <button onClick={async () => (window.location.href = await getAuthorizationUrl())}>
          Mit Spotify verbinden
        </button>
      ) : (
        <>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {track ? (
            <div>
              <img
                src={track.album.images[0].url}
                alt="cover"
                width={200}
                style={{ borderRadius: "12px", marginBottom: "10px" }}
              />
              <h2>{track.name}</h2>
              <p>{track.artists.map((a) => a.name).join(", ")}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
                <button onClick={handlePrevious}>⏮️</button>
                <button onClick={handlePlayPause}>{isPlaying ? "⏸️" : "▶️"}</button>
                <button onClick={handleNext}>⏭️</button>
              </div>
            </div>
          ) : (
            <p>Keine Wiedergabe gefunden.</p>
          )}
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "#1DB954",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
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
