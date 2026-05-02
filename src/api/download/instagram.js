const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadInstagramMedia(instagramUrl) {
    const postId = instagramUrl.split('/p/')[1]?.split('/')[0];
    if (!postId) throw new Error('URL de Instagram inválida');
    
    const response = await axios.get(`https://www.instagram.com/graphql/query/`, {
        params: {
            query_hash: 'c9100bf08b15db9d5b9a09f8a91da5a3',
            variables: JSON.stringify({ shortcode: postId })
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
    });
    
    const media = response.data.data.shortcode_media;
    return {
        postId,
        caption: media.edge_media_to_caption.edges[0]?.node.text || 'Sin descripción',
        isVideo: media.is_video,
        mediaUrl: media.is_video ? media.video_url : media.display_url,
        likes: media.edge_liked_by?.count || 0
    };
}

module.exports = function(app) {
    app.get('/download/instagram', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/instagram?url=URL_DEL_POST"
            });
        }
        try {
            const result = await downloadInstagramMedia(url);
            if (req.query.download === 'true') {
                return res.redirect(result.mediaUrl);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: {
                    type: result.isVideo ? 'video' : 'image',
                    url: result.mediaUrl,
                    caption: result.caption,
                    likes: result.likes
                }
            });
        } catch (err) {
            console.error('[Instagram Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};