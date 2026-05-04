// search/youtube.js
const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ========== 1. SCRAPER CON INVIDIOUS (intenta varias instancias) ==========
const INVICIOUS_INSTANCES = [
    'https://invidious.io.lol',
    'https://inv.vern.cc',
    'https://invidious.privacydev.net',
    'https://inv.skymods.cc',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
    'https://inv.riverside.rocks'
];

async function searchInvidious(query, limit) {
    for (const instance of INVICIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': USER_AGENT },
                timeout: 8000
            });
            const data = response.data;
            if (data && data.length) {
                return data.slice(0, limit).map(video => ({
                    title: video.title || "Sin título",
                    channel: video.author || "Desconocido",
                    channelId: video.authorId || "",
                    duration: video.lengthSeconds ? `${Math.floor(video.lengthSeconds / 60)}:${(video.lengthSeconds % 60).toString().padStart(2, '0')}` : "?",
                    views: video.viewCount ? video.viewCount.toLocaleString() : "N/A",
                    thumbnail: video.videoThumbnails?.[3]?.url || video.videoThumbnails?.[0]?.url || "",
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    publishedAt: video.publishedText || "N/A"
                }));
            }
        } catch (e) {
            console.log(`[Invidious] ${instance} falló: ${e.message}`);
        }
    }
    return null;
}

// ========== 2. FALLBACK: PIPED API (alternativa a Invidious) ==========
async function searchPiped(query, limit) {
    try {
        const url = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });
        const items = response.data.items || [];
        return items.slice(0, limit).map(video => ({
            title: video.title || "Sin título",
            channel: video.uploaderName || "Desconocido",
            channelId: video.uploaderUrl?.split('/').pop() || "",
            duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : "?",
            views: video.views ? video.views.toLocaleString() : "N/A",
            thumbnail: video.thumbnail || "",
            url: `https://www.youtube.com/watch?v=${video.url}`,
            publishedAt: video.uploadedDate || "N/A"
        }));
    } catch (e) {
        console.log(`[Piped] falló: ${e.message}`);
        return null;
    }
}

// ========== 3. ÚLTIMO FALLBACK: API PÚBLICA sin clave (funciona siempre) ==========
async function searchFallback(query, limit) {
    try {
        // Usar la API de yt-api (servicio público)
        const url = `https://yt-api.levanter.workers.dev/search?q=${encodeURIComponent(query)}&max=${limit}`;
        const response = await axios.get(url, { timeout: 10000 });
        const items = response.data.results || [];
        return items.filter(v => v.type === 'video').map(video => ({
            title: video.title || "Sin título",
            channel: video.uploaderName || "Desconocido",
            channelId: video.uploaderUrl?.split('/').pop() || "",
            duration: video.length || "?",
            views: video.views ? video.views.toLocaleString() : "N/A",
            thumbnail: video.thumbnail || "",
            url: `https://www.youtube.com/watch?v=${video.id}`,
            publishedAt: video.uploadedAt?.split('T')[0] || "N/A"
        }));
    } catch (e) {
        console.log(`[Fallback] falló: ${e.message}`);
        return null;
    }
}

// ========== 4. FUNCIÓN PRINCIPAL QUE ENCADENA LOS MÉTODOS ==========
async function searchYouTube(query, limit) {
    // Método 1: Invidious
    let results = await searchInvidious(query, limit);
    if (results && results.length) return results;

    // Método 2: Piped
    results = await searchPiped(query, limit);
    if (results && results.length) return results;

    // Método 3: Fallback universal
    results = await searchFallback(query, limit);
    if (results && results.length) return results;

    // Si todo falla, devolver array vacío
    return [];
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        let limit = parseInt(req.query.limit) || 20;
        if (isNaN(limit)) limit = 20;
        if (limit > 50) limit = 50;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            const results = await searchYouTube(query, limit);
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};