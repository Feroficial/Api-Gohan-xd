const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const APTOIDE_SEARCH = 'https://en.aptoide.com/search/apps';

async function searchAptoide(query, limit = 10) {
    const url = `${APTOIDE_SEARCH}?query=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
        headers: { 'User-Agent': UA },
        timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const results = [];

    $('.app-entry').each((i, el) => {
        if (results.length >= limit) return false;
        
        const name = $(el).find('.name').text().trim();
        const packageName = $(el).find('.package-name').text().trim();
        const version = $(el).find('.version').text().trim();
        const size = $(el).find('.size').text().trim();
        const icon = $(el).find('.icon img').attr('src');
        let downloadUrl = $(el).find('.button-download').attr('href');
        if (downloadUrl && !downloadUrl.startsWith('http')) {
            downloadUrl = 'https://en.aptoide.com' + downloadUrl;
        }
        
        if (name && downloadUrl) {
            results.push({
                name,
                package: packageName,
                version,
                size,
                icon,
                download_url: downloadUrl,
                source: 'Aptoide'
            });
        }
    });
    
    return results;
}

module.exports = function(app) {
    app.get('/search/apk', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/apk?q=whatsapp&limit=5"
            });
        }
        
        try {
            const results = await searchAptoide(query, Math.min(limit, 30));
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total: results.length,
                result: results
            });
        } catch (error) {
            console.error('[APK Search Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};