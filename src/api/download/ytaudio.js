const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function ytmp3(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) throw new Error('Invalid YouTube URL');
        
        const pageRes = await axios.get('https://yt1d.com/', {
            headers: { 'User-Agent': UA }
        });
        
        const $ = cheerio.load(pageRes.data);
        const token = $('input[name="token"]').val();
        
        const formData = new URLSearchParams();
        formData.append('url', url);
        formData.append('token', token);
        formData.append('format', 'mp3');
        
        const convertRes = await axios.post('https://yt1d.com/api/ajaxConvert', formData, {
            headers: {
                'User-Agent': UA,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!convertRes.data || !convertRes.data.downloadUrl) {
            throw new Error('No se pudo obtener el enlace de descarga');
        }
        
        const titleRes = await axios.get(url, {
            headers: { 'User-Agent': UA }
        });
        
        const titleMatch = titleRes.data.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Unknown';
        
        const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        
        return {
            title: title,
            thumbnail: thumbnail,
            download_url: convertRes.data.downloadUrl
        };
        
    } catch (error) {
        throw new Error(`Error: ${error.message}`);
    }
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

module.exports = function(app) {
    
    app.get('/download/ytaudio', async (req, res) => {
        const url = String(req.query.url || "").trim();
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL parameter is required"
            });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Invalid YouTube URL"
            });
        }
        
        try {
            const result = await ytmp3(url);
            
            if (req.query.download === 'true' && result.download_url) {
                return res.redirect(result.download_url);
            }
            
            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    thumbnail: result.thumbnail,
                    download_url: result.download_url
                }
            });
            
        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};