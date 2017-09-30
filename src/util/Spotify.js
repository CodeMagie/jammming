let accessToken = '';
const CLIENT_ID = '4ee089d889234844a99e9f5f229b480e';
const REDIRECT_URI = 'https://code-magie.surge.sh';

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&scope=playlist-modify-public&redirect_uri=${REDIRECT_URI}`;
      window.location = accessUrl;
    }
  },

  search(term) {
      accessToken = Spotify.getAccessToken();
      const fetchURL = `https://api.spotify.com/v1/search?type=track&q=${term}`;
      const headers = {headers: {Authorization: `Bearer  ${accessToken}`}};
      return fetch(fetchURL, headers).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Request failed!');
      }, networkError => console.log(networkError.message)
      ).then(jsonResponse => {
          if (jsonResponse.tracks.items) {
            return jsonResponse.tracks.items.map(track => {
              return {
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri,
              };
            })
          } else return [];
        });
    },

    savePlaylist(name, trackURIs) {
      if (!name || !trackURIs) return;
      const accessToken = Spotify.getAccessToken();
      const headers = {Authorization: `Bearer ${accessToken}`};
      const createPlaylistHeaders = {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({name: name}) };
      const addTracksHeaders = {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({'uris': trackURIs,}) };
      let userID, playlistID;
      // Get user id from Spotify
      return fetch('https://api.spotify.com/v1/me', {headers: headers})
      .then(response => response.json())
      .then(jsonResponse => {
        userID = jsonResponse.id;
        // Create playlist
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, createPlaylistHeaders)
          .then(response => response.json())
          .then(jsonResponse => {
            playlistID = jsonResponse.id;
            // Add tracks to playlist
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, addTracksHeaders)
          });
      });
    },
  };

  export default Spotify;
