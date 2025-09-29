// auth.js
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

function generateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getCodeVerifier() {
  let verifier = localStorage.getItem("code_verifier");
  if (!verifier) {
    verifier = generateRandomString(128);
    localStorage.setItem("code_verifier", verifier);
  }
  return verifier;
}

export async function getAuthorizationUrl() {
  const verifier = await getCodeVerifier();
  const challenge = await sha256(verifier);
  const state = generateRandomString(16);
  const scope = "user-read-playback-state user-modify-playback-state user-read-currently-playing";
  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge_method=S256&code_challenge=${challenge}`;
}

export async function fetchAccessToken(code) {
  const verifier = await getCodeVerifier();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("expires_in", Date.now() + data.expires_in * 1000);
  return data.access_token;
}

export function getAccessToken() {
  const token = localStorage.getItem("access_token");
  const expires = parseInt(localStorage.getItem("expires_in") || "0");
  if (!token || Date.now() > expires) {
    return null;
  }
  return token;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("expires_in");
  localStorage.removeItem("code_verifier");
}
