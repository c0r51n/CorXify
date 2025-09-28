// src/auth.js
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const redirectUri = "https://cor-xify.vercel.app/callback";

const scopes = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
];

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
