const axios = require('axios');

const APTOIDE_API = 'https://ws75.aptoide.com/api/7/apps/search';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function apkDownload(query) {
    const response = await axios.get(APTOIDE_API, {
        params: { query, limit: 1 },
        headers: { 'User-Agent': UA },
        timeout: 15000
    });
    const data = response.data;
    if (data.info?.status !== 'OK' || !data.datalist?.list?.length) {
        throw new Error('No se encontró la aplicación');
    }
    const app = data.datalist.list[0];
    const downloadUrl = app.file?.path;
    if (!downloadUrl) throw new Error('No se pudo obtener el enlace de descarga');
    return {
        name: app.name,
        package: app.package,
        version: app.file?.vername || 'N/A',
        size: app.size ? `${(app.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
        icon: app.icon,
        download_url: downloadUrl
    };
}

module.exports = function(app) {
    app.get('/download/apk', async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/download/apk"
            });
        }
        try {
            const result = await apkDownload(query);
            if (req.query.download === 'true') {
                return res.redirect(result.download_url);
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