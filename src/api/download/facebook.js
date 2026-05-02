const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function facebookDownload(url) {
    try {
        const response = await axios.get('https://fbdown.net/index.php', {
            params: { URL: url },
            headers: { 'User-Agent': UA }
        });
        const $ = cheerio.load(response.data);
        const downloadLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('.mp4')) {
                downloadLinks.push(href);
            }
        });
        if (downloadLinks.length === 0) throw new Error('No se pudo obtener el video');
        const qualityLabels = ['HD', 'SD', 'Normal'];
        const videos = downloadLinks.slice(0, 2).map((link, idx) => ({
            quality: qualityLabels[idx] || 'Normal',
            url: link
        }));
        const title = $('meta[property="og:title"]').attr('content') || 'Facebook Video';
        const thumbnail = $('meta[property="og:image"]').attr('content') || null;
        return { title, thumbnail, videos };
    } catch (error) {
        throw new Error(`Error en Facebook: ${error.message}`);
    }
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
            if (req.query.download === 'true' && result.videos.length > 0) {
                return res.redirect(result.videos[0].url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};