const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/rate', async (req, res) => {
    const { movieId, userId, rating, comment } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO "Review" (movie_id, user_id, rating, review_text)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [movieId, userId, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create review' });
    }
});

router.get('/isreview', async (req, res) => {
    const { movieId, userId } = req.query;
    console.log('Received movieId:', movieId, 'userId:', userId);
    try {
        const result = await pool.query(
            `SELECT EXISTS (
                SELECT 1 FROM "Review" 
                WHERE movie_id = $1 AND user_id = $2
            ) AS is_reviewed`,
            [movieId, userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to check review status' });
    }
});

router.get('/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.*, u.username AS user_name
             FROM "Review" r
             JOIN "User" u ON r.user_id = u.user_id
             WHERE r.movie_id = $1
             ORDER BY r.created_at DESC`,
            [movieId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

module.exports = router;