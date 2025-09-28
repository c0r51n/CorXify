// src/auth.js

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "https://cor-xify.vercel.app/callback";

const scopes = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
];

// Baut die URL für Spotify Login
export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "token", // Implicit Grant Flow
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Token aus URL auslesen (nach Redirect)
export function extractTokenFromUrl() {
  const hash = window.location.hash.substring(1); // alles nach #
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");
  if (token) {
    localStorage.setItem("access_token", token);
  }
  return token;
}

// Local Storage Token
export function getStoredToken() {
  return localStorage.getItem("access_token");
}
