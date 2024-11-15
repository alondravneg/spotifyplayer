// Global variables
let accessToken = "";

// Spotify authorization details
const clientId = "3ab7051796fe462e89c30b55b11d00e0"; // Replace with your Client ID
const redirectUri = 'http://localhost:8000';
const authEndpoint = "https://accounts.spotify.com/authorize";
const scopes = [
  "user-read-private",
  "user-read-email",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-modify-private",
  "user-top-read"
];

// Login button
document.getElementById("login-button").addEventListener("click", () => {
  const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`;
  window.location.href = authUrl;
});

// Extract token from URL hash
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash) {
    accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
    if (accessToken) {
      document.getElementById("login-button").style.display = "none";
      document.getElementById("search-container").style.display = "block";
    }
  }
});

// Fetch Top 5 Tracks
document.getElementById("top-tracks-button").addEventListener("click", async () => {
  const tracks = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
  displayTracks(tracks.items);
});

// Fetch Recommendations based on Top Tracks
document.getElementById("recommendations-button").addEventListener("click", async () => {
  const topTracks = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
  const topTracksIds = topTracks.items.map(track => track.id).join(',');
  const recommendations = await fetchWebApi(`v1/recommendations?limit=5&seed_tracks=${topTracksIds}`, 'GET');
  displayTracks(recommendations.tracks);
});

// Create and Save Playlist (only top 5 songs)
document.getElementById("create-playlist-button").addEventListener("click", async () => {
  const user = await fetchWebApi('v1/me', 'GET');
  const playlist = await fetchWebApi(`v1/users/${user.id}/playlists`, 'POST', {
    "name": "My recommendation playlist",
    "description": "Playlist created by the tutorial",
    "public": false
  });

  const tracks = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
  const tracksUri = tracks.items.map(track => track.uri).join(',');
  await fetchWebApi(`v1/playlists/${playlist.id}/tracks?uris=${tracksUri}`, 'POST');
  
  console.log(`Playlist created: ${playlist.name}`);
});

// Search Songs
document.getElementById("search-button").addEventListener("click", async () => {
  const query = document.getElementById("search-input").value;
  if (!query) return;

  const response = await fetchWebApi(`v1/search?q=${query}&type=track&limit=5`, 'GET');
  displayTracks(response.tracks.items);
});

// Display Tracks
function displayTracks(tracks) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  tracks.forEach(track => {
    const trackElement = document.createElement("div");
    trackElement.classList.add("track");

    trackElement.innerHTML = `
      <img src="${track.album.images[0].url}" alt="${track.name}">
      <div>
        <p><strong>${track.name}</strong> - ${track.artists.map(artist => artist.name).join(", ")}</p>
        <button onclick="playTrack('${track.uri}')">Reproducir</button>
      </div>
    `;
    resultsContainer.appendChild(trackElement);
  });
}

// Play Track
function playTrack(trackUri) {
  const player = document.getElementById("player");
  player.innerHTML = `<iframe src="https://open.spotify.com/embed/track/${trackUri.split(":").pop()}" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}

// Fetch API Helper
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    method,
    body: JSON.stringify(body)
  });
  return await res.json();
}

// Display the playlist player
function displayPlaylistPlayer(playlistId) {
    const player = document.getElementById("player");
    player.innerHTML = `
      <iframe
        src="https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0"
        width="100%"
        height="380"
        frameborder="0"
        allowtransparency="true"
        allow="encrypted-media"
        allow="autoplay; clipboard-write; fullscreen; picture-in-picture"
        loading="lazy">
      </iframe>
    `;
  }
  
  // Create and Save Playlist
  document.getElementById("create-playlist-button").addEventListener("click", async () => {
    const user = await fetchWebApi('v1/me', 'GET');
    const playlist = await fetchWebApi(`v1/users/${user.id}/playlists`, 'POST', {
      "name": "musiquita para ti :)",
      "description": "Playlist created with your top 5 songs and 5 recommendations",
      "public": false
    });
  
    const tracks = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=10', 'GET');
    const tracksUri = tracks.items.map(track => track.uri).join(',');
    await fetchWebApi(`v1/playlists/${playlist.id}/tracks?uris=${tracksUri}`, 'POST');
    
    console.log(`Playlist created: ${playlist.name}`);
    
    // Display the playlist player
    displayPlaylistPlayer(playlist.id);
  });