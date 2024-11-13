// URL para redirigir a la autenticación de Spotify
const clientId = '3ab7051796fe462e89c30b55b11d00e0'; // Reemplaza con tu Client ID
const redirectUri = 'http://localhost:8000';
const authEndpoint = 'https://accounts.spotify.com/authorize';
const scopes = ['user-read-playback-state', 'user-modify-playback-state', 'streaming'];

let accessToken = null;
let player = null;

// Autenticación de usuario en Spotify
function loginWithSpotify() {
    const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
    window.location = authUrl;
}

// Extraer el token de acceso de la URL
window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash) {
        accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
        window.localStorage.setItem('spotifyAccessToken', accessToken);
        window.location.hash = ''; // Limpia el hash de la URL

        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('controls').style.display = 'block';

        initializePlayer();
    } else {
        accessToken = window.localStorage.getItem('spotifyAccessToken');
        if (accessToken) {
            document.getElementById('loginButton').style.display = 'none';
            document.getElementById('controls').style.display = 'block';
            initializePlayer();
        }
    }
});

// Inicializar el reproductor de Spotify
function initializePlayer() {
    window.onSpotifyWebPlaybackSDKReady = () => {
        player = new Spotify.Player({
            name: 'Reproductor Web',
            getOAuthToken: cb => { cb(accessToken); },
            volume: 0.5
        });

        // Conecta el reproductor a un dispositivo de reproducción
        player.connect().then(success => {
            if (success) {
                console.log('El reproductor de Spotify está listo para usarse.');
            }
        });

        // Manejadores de evento para el reproductor
        player.addListener('player_state_changed', state => {
            if (state) {
                document.getElementById('trackInfo').textContent = `Reproduciendo: ${state.track_window.current_track.name} de ${state.track_window.current_track.artists[0].name}`;
            }
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('Listo con el ID de dispositivo', device_id);
            play(device_id);
        });
    };
}

// Buscar una canción
document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    if (query) {
        searchTrack(query);
    } else {
        console.log('Por favor, ingresa un término de búsqueda.');
    }
});

function searchTrack(query) {
    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const track = data.tracks.items[0];
        if (track) {
            playTrack(track.uri);
            document.getElementById('trackInfo').textContent = `Reproduciendo: ${track.name} de ${track.artists[0].name}`;
        } else {
            console.log('No se encontró ninguna canción.');
        }
    })
    .catch(error => console.error('Error al buscar la canción:', error));
}

// Reproducir la canción en el dispositivo
function playTrack(trackUri) {
    fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri] })
    })
    .catch(error => console.error('Error al reproducir la canción:', error));
}

// Pausar/reanudar la reproducción
document.getElementById('playPauseButton').addEventListener('click', () => {
    player.togglePlay();
});

// Detener la reproducción
document.getElementById('stopButton').addEventListener('click', () => {
    player.pause();
});

// Iniciar sesión al hacer clic en el botón de inicio de sesión
document.getElementById('loginButton').addEventListener('click', loginWithSpotify);
