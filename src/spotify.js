export async function getCurrentlyPlaying(token) {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 204) {
    return null; // Nichts spielt gerade
  }

  return await response.json();
}
