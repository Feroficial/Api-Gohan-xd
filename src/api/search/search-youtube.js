const yts = require('yt-search');

async function searchYouTube(query, limit = 20) {
    const result = await yts(query);
    const videos = result.videos.slice(0, limit);
    
    return videos.map(video => ({
        title: video.title,
        channel: video.author.name,
        channelId: video.author.id,
        duration: video.duration.timestamp || `${video.duration.seconds}s`,
        views: video.views.toLocaleString(),
        thumbnail: video.thumbnail,
        url: video.url,
        publishedAt: video.uploadedAt || 'N/A'
    }));
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            const results = await searchYouTube(query, Math.min(limit, 30));
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};