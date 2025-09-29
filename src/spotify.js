// spotify.js
import { getAccessToken } from "./auth";

const BASE_URL = "https://api.spotify.com/v1";

async function fetchSpotify(endpoint, method = "GET", body = null) {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return await res.json();
}

export const getCurrentPlayback = () => fetchSpotify("/me/player/currently-playing");

export const play = () => fetchSpotify("/me/player/play", "PUT");

export const pause = () => fetchSpotify("/me/player/pause", "PUT");

export const nextTrack = () => fetchSpotify("/me/player/next", "POST");

export const previousTrack = () => fetchSpotify("/me/player/previous", "POST");
