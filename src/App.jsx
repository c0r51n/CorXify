import React, { useEffect, useState } from "react";
import { redirectToSpotifyLogin, fetchAccessToken } from "./auth";
import { getCurrentlyPlaying } from "./spotify";

export default function App() {
  const [token, setToken] = useState(null);
  const [track, setTrack] = useState(null);

  useEffect(() => {
    // Prüfen ob wir von Spotify Redirect zurückkommen
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !token) {
      fetchAccessToken(code).then(data => {
        setToken(data.access_token);
        localStorage.setItem("access_token", data.access_token);
        window.history.replaceState({}, document.title, "/");
      });
    } else {
      const savedToken = localStorage.getItem("access_token");
      if (savedToken) setToken(savedToken);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const data = await getCurrentlyPlaying(token);
      setTrack(data);
    }, 5000); // alle 5s aktualisieren
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial", color: "#fff", backgroundColor: "#121212", minHeight: "100vh" }}>
      <h1>Spotify PWA</h1>
      {!token && (
        <button onClick={redirectToSpotifyLogin} style={{ padding: 10, background: "#1DB954", border: "none", borderRadius: 5, color: "white" }}>
          Mit Spotify verbinden
        </button>
      )}
      {track && track.item && (
        <div>
          <h2>{track.item.name}</h2>
          <p>{track.item.artists.map(a => a.name).join(", ")}</p>
          <img src={track.item.album.images[0].url} alt="Album Cover" style={{ width: 200 }} />
        </div>
      )}
    </div>
  );
}
