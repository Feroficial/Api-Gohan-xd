const axios = require('axios');

const YOUTUBE_API_KEY = 'AIzaSyDBrbDJAhuamM54a8hLGkUlAC8qcUKS3ss';

function formatDuration(isoDuration) {
    if (!isoDuration) return "00:00";
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "00:00";
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatPublishedAt(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny"
            });
        }

        if (!YOUTUBE_API_KEY) {
            return res.status(503).json({
                status: false,
                creator: "DVLYONN",
                error: "YouTube API no configurada"
            });
        }

        try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
            const searchRes = await axios.get(searchUrl);

            if (!searchRes.data.items || searchRes.data.items.length === 0) {
                return res.json({
                    status: true,
                    creator: "DVLYONN",
                    query: query,
                    total_results: 0,
                    result: []
                });
            }

            const videoIds = searchRes.data.items.map(item => item.id.videoId).join(',');
            const channelIds = searchRes.data.items.map(item => item.snippet.channelId);

            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
            const videosRes = await axios.get(videosUrl);

            const uniqueChannelIds = [...new Set(channelIds)].join(',');
            const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${uniqueChannelIds}&key=${YOUTUBE_API_KEY}`;
            const channelsRes = await axios.get(channelsUrl);

            const channelMap = {};
            channelsRes.data.items.forEach(channel => {
                channelMap[channel.id] = channel.statistics.subscriberCount;
            });

            const results = videosRes.data.items.map(video => ({
                title: video.snippet.title,
                description: video.snippet.description,
                channel: video.snippet.channelTitle,
                channelId: video.snippet.channelId,
                subscribers: channelMap[video.snippet.channelId] || "N/A",
                publishedAt: formatPublishedAt(video.snippet.publishedAt),
                duration: formatDuration(video.contentDetails.duration),
                views: video.statistics.viewCount || 0,
                likes: video.statistics.likeCount || 0,
                comments: video.statistics.commentCount || 0,
                thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
                url: `https://www.youtube.com/watch?v=${video.id}`
            }));

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