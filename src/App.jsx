import React, { useState, useEffect } from "react";
import { getAuthorizationUrl, fetchAccessToken, getAccessToken, logout } from "./auth";
import { getCurrentPlayback, play, pause, nextTrack, previousTrack } from "./spotify";

function App() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Code aus URL abholen
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
  }, []);

  async function loadCurrentTrack() {
    try {
      const data = await getCurrentPlayback();
      if (data && data.item) {
        setTrack(data.item);
        setIsPlaying(!!data.is_playing);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ✅ FIXED VERSION
async function handlePlayPause() {
  try {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      // Spotify braucht kurz, um wieder Daten zu liefern
      setTimeout(() => {
        loadCurrentTrack();
      }, 1000);
      setIsPlaying(true);
    }
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
              <button onClick={previousTrack}>⏮️</button>
              <button onClick={handlePlayPause}>{isPlaying ? "⏸️" : "▶️"}</button>
              <button onClick={nextTrack}>⏭️</button>
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
