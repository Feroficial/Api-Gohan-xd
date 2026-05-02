const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function spotifyDownload(url) {
    try {
        const trackId = extractTrackId(url);
        if (!trackId) throw new Error('URL de Spotify no válida');
        
        // Usar API pública de spotify-downloader
        const apiUrl = `https://spotifydownloader.vercel.app/api/track/${trackId}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': UA,
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        const data = response.data;
        
        if (!data || !data.downloadUrl) {
            throw new Error('No se pudo obtener el enlace de descarga');
        }
        
        return {
            title: data.title || 'Unknown',
            artist: data.artist || 'Unknown',
            thumbnail: data.thumbnail || null,
            duration: data.duration || 0,
            download_url: data.downloadUrl
        };
        
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

function extractTrackId(url) {
    const patterns = [
        /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
        /spotify:track:([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

module.exports = function(app) {
    app.get('/download/spotify', async (req, res) => {
        const url = String(req.query.url || "").trim();
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Se requiere el parámetro 'url'",
                usage: "/download/spotify?url=https://open.spotify.com/track/xxxxx"
            });
        }
        
        if (!url.includes('open.spotify.com/track/')) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL de Spotify no válida. Usa una URL de canción (track)"
            });
        }
        
        try {
            const result = await spotifyDownload(url);
            
            if (req.query.download === 'true' && result.download_url) {
                return res.redirect(result.download_url);
            }
            
            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    artist: result.artist,
                    thumbnail: result.thumbnail,
                    duration: result.duration,
                    download_url: result.download_url
                }
            });
            
        } catch (error) {
            console.error('Spotify error:', error.message);
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};