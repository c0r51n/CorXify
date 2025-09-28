// src/auth.js

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

// PKCE Hilfsfunktionen
function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Redirect zu Spotify Login (PKCE)
export async function redirectToSpotifyLogin() {
  const verifier = generateRandomString(128);
  localStorage.setItem("code_verifier", verifier);

  const challenge = base64urlencode(await sha256(verifier));

  const scopes = [
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-top-read",
  ].join(" ");

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("response_type", "code"); // Authorization Code Flow
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("scope", scopes);
  url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("code_challenge", challenge);

  window.location = url.toString();
}

// Token mit Authorization Code holen
export async function fetchAccessToken(code) {
  const verifier = localStorage.getItem("code_verifier");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }
  return data.access_token;
}

// Access Token aus Local Storage holen
export function getStoredToken() {
  return localStorage.getItem("access_token");
}
