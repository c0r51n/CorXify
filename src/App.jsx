import React, { useEffect, useState } from "react";
import { redirectToSpotifyLogin, fetchAccessToken, getStoredToken } from "./auth";

export default function App() {
  const [token, setToken] = useState(null);
  const [track, setTrack] = useState(null);

  // Token aus URL oder LocalStorage holen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      // Authorization Code → Access Token holen
      fetchAccessToken(code).then(t => setToken(t));
      window.history.replaceState({}, document.title, "/"); // Query entfernen
    } else {
      const t = getStoredToken();
      if (t) setToken(t);
    }
  }, []);

  // Aktuell gespielten Song alle 5 Sekunden abfragen
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        const data = await response.json();
        setTrack(data);
      } else {
        setTrack(null);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial", color: "#fff", backgroundColor: "#121212", minHeight: "100vh" }}>
      <h1>CorXify Spotify PWA</h1>

      {!token && (
        <button
          onClick={() => redirectToSpotifyLogin()}
          style={{ padding: 10, background: "#1DB954", border: "none", borderRadius: 5, color: "white" }}
        >
          Mit Spotify verbinden
        </button>
      )}

      {track && track.item && (
        <div style={{ marginTop: 20 }}>
          <h2>{track.item.name}</h2>
          <p>{track.item.artists.map(a => a.name).join(", ")}</p>
          <img src={track.item.album.images[0].url} alt="Album Cover" style={{ width: 200 }} />
        </div>
      )}

      {!track && token && <p>Momentan läuft kein Song.</p>}
    </div>
  );
}
