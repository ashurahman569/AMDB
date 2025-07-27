const express = require('express');
const pool = require('../db');
const router = express.Router();

// Import existing middleware
const authorize = require('../middleware/authorize');

// Middleware to get full user info from database
const getUserInfo = async (req, res, next) => {
    try {
        // req.user.id comes from the authorize middleware
        const userResult = await pool.query(
            'SELECT user_id, username, email, user_type, is_active FROM "User" WHERE user_id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            return res.status(403).json({ error: 'User not found or account inactive' });
        }

        // Add user info to req.user
        req.user = {
            ...req.user,
            username: userResult.rows[0].username,
            email: userResult.rows[0].email,
            user_type: userResult.rows[0].user_type,
            is_active: userResult.rows[0].is_active
        };
        
        next();
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
            `SELECT r.*, u.username AS user_name, u.user_type
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

// PUT /:reviewId - Update a review
router.put('/:reviewId', authorize, getUserInfo, async (req, res) => {
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;
    const userId = req.user.id;

    try {
        // First check if the review exists and belongs to the user
        const checkReview = await pool.query(
            'SELECT user_id FROM "Review" WHERE review_id = $1',
            [reviewId]
        );

        if (checkReview.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (checkReview.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this review' });
        }

        // Update the review
        const result = await pool.query(
            `UPDATE "Review" 
             SET rating = $1, review_text = $2 
             WHERE review_id = $3 
             RETURNING *`,
            [rating, review_text, reviewId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /:reviewId - Delete a review
router.delete('/:reviewId', authorize, getUserInfo, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userType = req.user.user_type;

    try {
        // Check if the review exists
        const checkReview = await pool.query(
            'SELECT user_id FROM "Review" WHERE review_id = $1',
            [reviewId]
        );

        if (checkReview.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user owns the review or is a moderator/admin
        const isOwner = checkReview.rows[0].user_id === userId;
        const isModerator = userType === 'admin' || userType === 'moderator';

        if (!isOwner && !isModerator) {
            return res.status(403).json({ error: 'Unauthorized to delete this review' });
        }

        // Delete the review
        await pool.query('DELETE FROM "Review" WHERE review_id = $1', [reviewId]);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;