const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function facebookDownload(url) {
    const apiUrl = `https://api.ryzendesu.vip/api/download/facebook?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { headers: { 'User-Agent': UA } });
    const data = response.data;
    if (!data.status) throw new Error('No se pudo obtener el video');
    const videoUrl = data.result.hd || data.result.sd;
    if (!videoUrl) throw new Error('No se encontró enlace de video');
    return {
        title: data.result.title || 'Facebook Video',
        thumbnail: data.result.thumbnail || '',
        videos: [{ quality: 'HD', url: videoUrl }]
    };
}

module.exports = function(app) {
    app.get('/download/facebook', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/facebook?url=URL_DEL_VIDEO"
            });
        }
        try {
            const result = await facebookDownload(url);
            if (req.query.download === 'true') {
                return res.redirect(result.videos[0].url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            console.error('[Facebook Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};