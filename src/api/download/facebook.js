const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function facebookDownload(url) {
    try {
        // Paso 1: Obtener página inicial con el formulario
        const formData = new URLSearchParams();
        formData.append('URLz', url);
        const response = await axios.post('https://fdown.net/download.php', formData.toString(), {
            headers: {
                'User-Agent': UA,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://fdown.net/'
            }
        });

        const $ = cheerio.load(response.data);
        const downloadLinks = [];

        // Buscar enlaces de video .mp4
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('.mp4')) {
                downloadLinks.push(href);
            }
        });

        if (downloadLinks.length === 0) {
            throw new Error('No se encontraron enlaces de video');
        }

        // Obtener título y miniatura
        const title = $('title').text().trim() || 'Facebook Video';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        // Los enlaces normalmente vienen en orden: HD, SD
        const videos = downloadLinks.map((link, idx) => ({
            quality: idx === 0 ? 'HD' : 'SD',
            url: link
        }));

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
            console.error('[Facebook Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};