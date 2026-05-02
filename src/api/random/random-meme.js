const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getRandomMeme() {
    const subreddits = ['memes', 'dankmemes', 'MemesESP', 'goodmemes', 'wholesomememes'];
    const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
    const url = `https://www.reddit.com/r/${randomSub}/.json?limit=50`;
    
    const response = await axios.get(url, {
        headers: { 'User-Agent': UA }
    });
    
    const posts = response.data.data.children;
    const memes = posts.filter(post => {
        const url = post.data.url;
        return url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp');
    });
    
    if (memes.length === 0) throw new Error('No se encontraron memes');
    
    const randomMeme = memes[Math.floor(Math.random() * memes.length)].data;
    
    return {
        titulo: randomMeme.title,
        subreddit: randomMeme.subreddit_name_prefixed,
        url: randomMeme.url,
        votos: randomMeme.ups,
        comentarios: randomMeme.num_comments,
        autor: randomMeme.author,
        creado: new Date(randomMeme.created_utc * 1000).toLocaleDateString('es-ES')
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
                resultado: meme
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