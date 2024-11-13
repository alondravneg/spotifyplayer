// Variables globales
let accessToken = "";

// URL para autenticación
const clientId = "3ab7051796fe462e89c30b55b11d00e0"; // Reemplaza con tu Client ID
const redirectUri = 'http://localhost:8000';
const authEndpoint = "https://accounts.spotify.com/authorize";
const scopes = [
  "user-read-private",
  "user-read-email",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state"
];

// Botón de inicio de sesión
document.getElementById("login-button").addEventListener("click", () => {
  const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`;
  window.location.href = authUrl;
});

// Obtener el token de la URL después de iniciar sesión
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

// Búsqueda de canciones
document.getElementById("search-button").addEventListener("click", async () => {
  const query = document.getElementById("search-input").value;
  if (!query) return;

  const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  displayTracks(data.tracks.items);
});

// Mostrar los resultados de la búsqueda
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

// Reproducir la canción en el reproductor embebido de Spotify
function playTrack(trackUri) {
  const player = document.getElementById("player");
  player.innerHTML = `<iframe src="https://open.spotify.com/embed/track/${trackUri.split(":").pop()}" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}
