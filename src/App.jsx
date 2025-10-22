import React, { useState, useEffect } from "react";
import { getAuthorizationUrl, fetchAccessToken, getAccessToken, logout } from "./auth";
import { getCurrentPlayback, play, pause, nextTrack, previousTrack } from "./spotify";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

    // 🔁 Automatische Aktualisierung alle 0.1 Sekunden
    const interval = setInterval(loadCurrentTrack, 100);
    return () => clearInterval(interval);
  }, []);

  async function loadCurrentTrack() {
    try {
      const data = await getCurrentPlayback();
      if (data && data.item) {
        setTrack(data.item);
        setIsPlaying(data.is_playing);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePlayPause() {
    try {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }

      // 🕒 kurz warten, dann echten Status holen
      setTimeout(loadCurrentTrack, 1000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleNext() {
    try {
      await nextTrack();
      setTimeout(loadCurrentTrack, 1000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePrevious() {
    try {
      await previousTrack();
      setTimeout(loadCurrentTrack, 1000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", color: "#fff", background: "#121212", minHeight: "100vh" }}>
      <h1>CorXify</h1>
      {!getAccessToken() ? (
        <button onClick={async () => (window.location.href = await getAuthorizationUrl())}>
          Mit Spotify verbinden
        </button>
      ) : (
        <>
          {track ? (
            <div>
              <img src={track.album.images[0].url} alt="cover" width={200} />
              <h2>{track.name}</h2>
              <p>{track.artists.map((a) => a.name).join(", ")}</p>
              <button onClick={handlePrevious}>⏮️</button>
              <button onClick={handlePlayPause}>{isPlaying ? "⏸️" : "❌🤬▶️"}</button>
              <button onClick={handleNext}>⏭️</button>
            </div>
          ) : (
            <p>Keine Wiedergabe gefunden.</p>
          )}
          <button
            style={{ position: "absolute", top: 20, right: 20 }}
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
