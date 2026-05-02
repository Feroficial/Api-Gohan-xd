const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getRandomMeme() {
    const query = 'memes graciosos';
    const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22page_size%22%3A50%7D%7D`;
    
    const response = await axios.get(url, {
        headers: {
            'User-Agent': UA,
            'Accept': 'application/json'
        }
    });
    
    const results = response.data.resource_response?.data?.results;
    if (!results || results.length === 0) {
        throw new Error('No se encontraron memes');
    }
    
    const memes = results.filter(item => item.images?.orig?.url);
    if (memes.length === 0) throw new Error('No se encontraron memes');
    
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    
    return {
        titulo: randomMeme.title || 'Meme divertido',
        url: randomMeme.images.orig.url,
        votos: randomMeme.like_count || 0,
        comentarios: randomMeme.comment_count || 0,
        autor: randomMeme.pinner?.username || 'Anónimo'
    };
}

module.exports = function(app) {
    app.get('/random/meme', async (req, res) => {
        try {
            const meme = await getRandomMeme();
            
            if (req.query.imagen === 'true' || req.query.download === 'true') {
                return res.redirect(meme.url);
            }
            
            return res.status(200).json({
                status: true,
                creador: "DVLYONN",
                resultado: {
                    titulo: meme.titulo,
                    url: meme.url,
                    votos: meme.votos,
                    comentarios: meme.comentarios,
                    autor: meme.autor,
                    creado: new Date().toLocaleDateString('es-ES')
                }
            });
            
        } catch (error) {
            console.error('Meme error:', error.message);
            return res.status(500).json({
                status: false,
                creador: "DVLYONN",
                error: error.message
            });
        }
    });
};