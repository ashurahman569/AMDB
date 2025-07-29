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

// Middleware to check if user is admin or moderator
const requireModeratorOrAdmin = (req, res, next) => {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'moderator' && req.user.user_type !== 'headadmin') {
        return res.status(403).json({ error: 'Unauthorized: Admin or moderator access required' });
    }
    next();
};

// Middleware to check if user is admin only
const requireAdmin = (req, res, next) => {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'headadmin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
};

//for getting all movie records
router.get('/movies', async (req, res) => {
    try {
        const allMovies = await pool.query(`
            SELECT m.*
            FROM "Movie" m
            GROUP BY m.movie_id
            ORDER BY m.movie_id
        `);
        res.json(allMovies.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all people
router.get('/people', async (req, res) => {
    try {
        const allPeople = await pool.query('SELECT * FROM "Person" ORDER BY person_id');
        res.json(allPeople.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all actors
router.get('/actors', async (req, res) => {
    try {
        const allActors = await pool.query('SELECT a.actor_id, p.* FROM "Actor" a JOIN "Person" p ON a.person_id = p.person_id ORDER BY a.actor_id');
        res.json(allActors.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all directors
router.get('/directors', async (req, res) => {
    try {
        const allDirectors = await pool.query('SELECT d.director_id, p.* FROM "Director" d JOIN "Person" p ON d.person_id = p.person_id ORDER BY d.director_id');
        res.json(allDirectors.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all writers
router.get('/writers', async (req, res) => {
    try {
        const allWriters = await pool.query('SELECT w.writer_id, p.* FROM "Writer" w JOIN "Person" p ON w.person_id = p.person_id ORDER BY w.writer_id');
        res.json(allWriters.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all roles
router.get('/roles', async (req, res) => {
    try {
        const allRoles = await pool.query(`
            SELECT r.role_id, r.movie_id,m.title AS movie_title, r.character_name, r.actor_id,
                   p.person_id, p.first_name, p.last_name
            FROM "Role" r
            JOIN "Actor" a ON r.actor_id = a.actor_id
            JOIN "Person" p ON a.person_id = p.person_id
            JOIN "Movie" m ON r.movie_id = m.movie_id
            ORDER BY r.role_id
        `);
        res.json(allRoles.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all movie directions
router.get('/directions', async (req, res) => {
    try {
        const allDirections = await pool.query(`
            SELECT md.movie_id, m.title AS movie_title, 
                   md.director_id, p.person_id, p.first_name, p.last_name
            FROM "Movie_Director" md
            JOIN "Director" d ON md.director_id = d.director_id
            JOIN "Person" p ON d.person_id = p.person_id
            JOIN "Movie" m ON md.movie_id = m.movie_id
        `);
        res.json(allDirections.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//for getting all movie writings
router.get('/scriptwriters', async (req, res) => {
    try {
        const allScripts = await pool.query(`
            SELECT mw.movie_id, m.title AS movie_title, 
                   mw.writer_id, p.person_id, p.first_name, p.last_name
            FROM "Movie_Writer" mw
            JOIN "Writer" w ON mw.writer_id = w.writer_id
            JOIN "Person" p ON w.person_id = p.person_id
            JOIN "Movie" m ON mw.movie_id = m.movie_id
        `);
        res.json(allScripts.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//api to edit movie record
router.put('/movies/:movieId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId } = req.params;
    const { title, runtime, about, plot, mpaa_rating, budget, box_office, poster_url, trailer_url, release_date} = req.body;
    try {
        const updateQuery = `
            UPDATE "Movie"
            SET title = $1, runtime = $2, about = $3, plot = $4,
                mpaa_rating = $5, budget = $6, box_office = $7,
                poster_url = $8, trailer_url = $9, release_date = $10
            WHERE movie_id = $11
        `;
        await pool.query(updateQuery, [
            title, runtime, about, plot, mpaa_rating, budget, box_office,
            poster_url, trailer_url, release_date, movieId
        ]);
        res.json({ message: 'Movie updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// USER MANAGEMENT ROUTES

// GET /users - Get all users (admin/moderator only)
router.get('/users', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, username, email, join_date, user_type, is_active
             FROM "User"
             ORDER BY join_date DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /ban-user - Ban a user (moderators/admins only)  
router.post('/ban-user', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    const { user_id, ban_reason } = req.body;
    const banner_id = req.user.id || req.user.user_id;

    try {
        // Validate input  
        if (!user_id || !ban_reason || !ban_reason.trim()) {
            return res.status(400).json({ error: 'User ID and ban reason are required' });
        }

        // Check if the user exists (remove is_active check)  
        const userCheck = await pool.query(
            'SELECT * FROM "User" WHERE user_id = $1',
            [user_id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userToBan = userCheck.rows[0];

        // Check permissions: moderators can only ban regular users, admins can ban regular users and moderators  
        if (req.user.user_type === 'moderator' && userToBan.user_type !== 'regular') {
            return res.status(403).json({ error: 'Moderators can only ban regular users' });
        }

        if (userToBan.user_type === 'admin') {
            return res.status(403).json({ error: 'Cannot ban admin users' });
        }

        // Prevent self-banning  
        if (userToBan.user_id === (req.user.id || req.user.user_id)) {
            return res.status(403).json({ error: 'Cannot ban yourself' });
        }

        // Check if already banned  
        const bannedCheck = await pool.query(
            'SELECT * FROM "Banned" WHERE user_id = $1 AND user_id NOT IN (SELECT user_id FROM "User")',
            [user_id]
        );

        if (bannedCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User is already banned' });
        }

        // Start transaction  
        await pool.query('BEGIN');

        try {
            // First, insert into Banned table to preserve user data  
            await pool.query(
                `INSERT INTO "Banned"   
                (user_id, username, email, password_hash, join_date, user_type, ban_reason, banner_id)  
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userToBan.user_id,
                    userToBan.username,
                    userToBan.email,
                    userToBan.password_hash,
                    userToBan.join_date,
                    'regular',
                    ban_reason.trim(),
                    banner_id
                ]
            );

            // Delete user from User table - this will trigger the deletion of reviews only  
            // Favourites and Watchlist records will remain for data integrity  
            await pool.query(
                'DELETE FROM "User" WHERE user_id = $1',
                [user_id]
            );

            // Commit transaction  
            await pool.query('COMMIT');

            console.log(`User ${userToBan.username} (ID: ${user_id}) has been banned by ${req.user.username} (ID: ${banner_id})`);

            res.json({
                message: 'User banned successfully',
                banned_user: {
                    user_id: userToBan.user_id,
                    username: userToBan.username,
                    ban_reason: ban_reason.trim()
                }
            });

        } catch (transactionError) {
            await pool.query('ROLLBACK');
            console.error('Error during ban transaction:', transactionError);

            // Check for specific database errors  
            if (transactionError.code === '23505') { // Unique constraint violation  
                return res.status(409).json({ error: 'User is already banned' });
            }

            if (transactionError.code === '23503') { // Foreign key constraint violation  
                return res.status(400).json({ error: 'Cannot ban user due to data constraints' });
            }

            throw transactionError;
        }

    } catch (error) {
        console.error('Error banning user:', error);

        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /banned-users - Get list of banned users (admin/moderator only)
router.get('/banned-users', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.*, u_banner.username as banner_name
             FROM "Banned" b
             LEFT JOIN "User" u_banner ON b.banner_id = u_banner.user_id
             WHERE b.user_id NOT IN (SELECT user_id FROM "User")
               AND b.banned_id = (
               SELECT MAX(b2.banned_id)
               FROM "Banned" b2
               WHERE b2.user_id = b.user_id
               )
             ORDER BY b.ban_date ASC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching banned users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /unban-user - Unban a user (admins only)
router.post('/unban-user', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    const { user_id } = req.body;
    const unbanner_id = req.user.id || req.user.user_id;
    try {
        // Start transaction
        await pool.query('BEGIN');

        try {
            // Get banned user info
            const bannedResult = await pool.query(
                'SELECT * FROM "Banned" WHERE user_id = $1',
                [user_id]
            );

            if (bannedResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Banned user not found' });
            }

            const bannedUser = bannedResult.rows[0];

            // Insert user back into User table
            await pool.query(
                `INSERT INTO "User" (user_id, username, email, password_hash, join_date, user_type)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    bannedUser.user_id,
                    bannedUser.username,
                    bannedUser.email,
                    bannedUser.password_hash,
                    bannedUser.join_date,
                    bannedUser.user_type
                ]
            );

            await pool.query(
                `INSERT INTO "Unbanned" (user_id, username, email, password_hash, join_date, user_type, unbanner_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    bannedUser.user_id,
                    bannedUser.username,
                    bannedUser.email,
                    bannedUser.password_hash,
                    bannedUser.join_date,
                    bannedUser.user_type,
                    unbanner_id
                ]
            );

            // Commit transaction
            await pool.query('COMMIT');

            res.json({ message: 'User unbanned successfully' });
        } catch (error) {
            // Rollback transaction on error
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /reviews - Get all reviews with user info (admin/moderator only)
router.get('/reviews', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.username AS user_name, u.user_type, m.title AS movie_title
             FROM "Review" r
             JOIN "User" u ON r.user_id = u.user_id
             JOIN "Movie" m ON r.movie_id = m.movie_id
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /reviews/:reviewId - Delete any review (admin/moderator only)
router.delete('/reviews/:reviewId', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    const { reviewId } = req.params;

    try {
        // Check if the review exists
        const checkReview = await pool.query(
            'SELECT review_id FROM "Review" WHERE review_id = $1',
            [reviewId]
        );

        if (checkReview.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Delete the review
        await pool.query('DELETE FROM "Review" WHERE review_id = $1', [reviewId]);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /stats - Get platform statistics (admin only)
router.get('/stats', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM "User") as active_users,
                (SELECT COUNT(DISTINCT b.user_id) FROM "Banned" b WHERE b.user_id NOT IN (SELECT user_id FROM "User")) as banned_users,
                (SELECT COUNT(*) FROM "Movie") as total_movies,
                (SELECT COUNT(*) FROM "Award") as total_awards,
                (SELECT COUNT(*) FROM "Review") as total_reviews,
                (SELECT COUNT(*) FROM "Person") as total_people
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//POST /promote-user - Promote a regular user to moderator (admin only)
router.post('/promote-user', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { user_id } = req.body;

    try {
        // Check if user exists and is regular
        const userResult = await pool.query(
            'SELECT user_id, user_type FROM "User" WHERE user_id = $1',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        if (user.user_type == 'admin') {
            return res.status(400).json({ error: 'Only regular users or moderators can be promoted' });
        }

        // Promote to moderator
        if (user.user_type == 'regular') {
            await pool.query(
                'UPDATE "User" SET user_type = $1 WHERE user_id = $2',
                ['moderator', user_id]
            );
            res.json({ message: 'User promoted to moderator successfully' });
        }
        else if (user.user_type == 'moderator') {
            await pool.query(
                'UPDATE "User" SET user_type = $1 WHERE user_id = $2',
                ['admin', user_id]
            );
            res.json({ message: 'User promoted to admin successfully' });
        }

    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /demote-user - Demote a moderator to regular (admin only)
 * Body: { user_id }
 */
router.post('/demote-user', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { user_id } = req.body;

    try {
        // Check if user exists and is moderator
        const userResult = await pool.query(
            'SELECT user_id, user_type FROM "User" WHERE user_id = $1',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        if (user.user_type == 'regular') {
            return res.status(400).json({ error: 'Regular users cannot be demoted' });
        }

        // Demote to regular
        if (user.user_type == 'moderator') {
            await pool.query(
                'UPDATE "User" SET user_type = $1 WHERE user_id = $2',
                ['regular', user_id]
            );
            res.json({ message: 'Moderator demoted to regular user successfully' });
        }

        else if (user.user_type == 'admin') {
            await pool.query(
                'UPDATE "User" SET user_type = $1 WHERE user_id = $2',
                ['moderator', user_id]
            );
            res.json({ message: 'Admin demoted to moderator successfully' });
        }

    } catch (error) {
        console.error('Error demoting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /user-activity/:userId - Get user activity (reviews and ban activities)
router.get('/user-activity/:userId', authorize, getUserInfo, requireModeratorOrAdmin, async (req, res) => {
    const { userId } = req.params;

    try {
        // Get user info first
        const userResult = await pool.query(
            'SELECT user_id, username, user_type FROM "User" WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const activities = [];

        // Get user's reviews
        const reviewsResult = await pool.query(
            `SELECT r.review_id, r.movie_id, r.rating, r.review_text, r.created_at,
                    m.title as movie_title, 'review' as activity_type
             FROM "Review" r
             JOIN "Movie" m ON r.movie_id = m.movie_id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );

        // Add reviews to activities
        reviewsResult.rows.forEach(review => {
            activities.push({
                ...review,
                activity_date: review.created_at
            });
        });

        // If user is moderator or admin, also get their ban activities
        if (user.user_type === 'moderator' || user.user_type === 'admin' || user.user_type === 'headadmin') {
            const banActivitiesResult = await pool.query(
                `SELECT b.banned_id, b.user_id as banned_user_id, b.username as banned_username,
                        b.ban_date, b.ban_reason, 'ban' as activity_type
                 FROM "Banned" b
                 WHERE b.banner_id = $1
                 ORDER BY b.ban_date DESC`,
                [userId]
            );

            // Add ban activities to activities
            banActivitiesResult.rows.forEach(ban => {
                activities.push({
                    ...ban,
                    activity_date: ban.ban_date
                });
            });
            const unbanActivitiesResult = await pool.query(
                `SELECT u.unbanned_id, u.user_id as unbanned_user_id, u.username as unbanned_username,
                        u.unban_date, 'unban' as activity_type
                 FROM "Unbanned" u
                 WHERE u.unbanner_id = $1
                 ORDER BY u.unban_date DESC`,
                [userId]
            );

            // Add ban activities to activities
            unbanActivitiesResult.rows.forEach(unban => {
                activities.push({
                    ...unban,
                    activity_date: unban.unban_date
                });
            });
        }

        // Sort all activities by date (most recent first)
        activities.sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date));

        res.json({
            user: user,
            activities: activities
        });

    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movie-genres/:movieId - Get genres for a specific movie  
router.get('/movie-genres/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT g.genre_id, g.name  
             FROM "Genre" g  
             JOIN "Movie_Genre" mg ON g.genre_id = mg.genre_id  
             WHERE mg.movie_id = $1  
             ORDER BY g.name`,
            [movieId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching movie genres:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movie-roles/:movieId - Get roles for a specific movie  
router.get('/movie-roles/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.role_id, r.character_name,   
                    p.person_id, p.first_name, p.last_name, p.photo_url  
             FROM "Role" r  
             JOIN "Actor" a ON r.actor_id = a.actor_id  
             JOIN "Person" p ON a.person_id = p.person_id  
             WHERE r.movie_id = $1  
             ORDER BY p.first_name, p.last_name`,
            [movieId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching movie roles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movie-directors/:movieId - Get directors for a specific movie  
router.get('/movie-directors/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT d.director_id, p.person_id, p.first_name, p.last_name, p.photo_url  
             FROM "Movie_Director" md  
             JOIN "Director" d ON md.director_id = d.director_id  
             JOIN "Person" p ON d.person_id = p.person_id  
             WHERE md.movie_id = $1  
             ORDER BY p.first_name, p.last_name`,
            [movieId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching movie directors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movie-writers/:movieId - Get writers for a specific movie  
router.get('/movie-writers/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT w.writer_id, p.person_id, p.first_name, p.last_name, p.photo_url  
             FROM "Movie_Writer" mw  
             JOIN "Writer" w ON mw.writer_id = w.writer_id  
             JOIN "Person" p ON w.person_id = p.person_id  
             WHERE mw.movie_id = $1  
             ORDER BY p.first_name, p.last_name`,
            [movieId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching movie writers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movie-awards/:movieId - Get awards for a specific movie  
router.get('/movie-awards/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const result = await pool.query(
            `SELECT   
                a.award_id, a.name as award_name, a.year, am.category, 'Movie' as award_type  
             FROM "Award" a  
             JOIN "Award_Movie" am ON a.award_id = am.award_id  
             WHERE am.movie_id = $1  
               
             UNION ALL  
               
             SELECT   
                a.award_id, a.name as award_name, a.year, aa.category,   
                CONCAT('Actor: ', p.first_name, ' ', p.last_name) as award_type  
             FROM "Award" a  
             JOIN "Award_Actor" aa ON a.award_id = aa.award_id  
             JOIN "Actor" act ON aa.actor_id = act.actor_id  
             JOIN "Person" p ON act.person_id = p.person_id  
             WHERE aa.movie_id = $1  
               
             UNION ALL  
               
             SELECT   
                a.award_id, a.name as award_name, a.year, ad.category,  
                CONCAT('Director: ', p.first_name, ' ', p.last_name) as award_type  
             FROM "Award" a  
             JOIN "Award_Director" ad ON a.award_id = ad.award_id  
             JOIN "Director" d ON ad.director_id = d.director_id  
             JOIN "Person" p ON d.person_id = p.person_id  
             WHERE ad.movie_id = $1  
               
             ORDER BY year DESC, award_name`,
            [movieId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching movie awards:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /awards - Get all awards  
router.get('/awards', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT award_id, name, year FROM "Award" ORDER BY year DESC, name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching awards:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /award-winners/:awardId - Get winners for a specific award  
router.get('/award-winners/:awardId', async (req, res) => {
    const { awardId } = req.params;
    try {
        const result = await pool.query(
            `SELECT   
                'Movie' as winner_type, m.title as winner_name, am.category, NULL as person_name  
             FROM "Award_Movie" am  
             JOIN "Movie" m ON am.movie_id = m.movie_id  
             WHERE am.award_id = $1  
               
             UNION ALL  
               
             SELECT   
                'Actor' as winner_type,   
                CONCAT(p.first_name, ' ', p.last_name) as winner_name,   
                aa.category,  
                m.title as person_name  
             FROM "Award_Actor" aa  
             JOIN "Actor" a ON aa.actor_id = a.actor_id  
             JOIN "Person" p ON a.person_id = p.person_id  
             JOIN "Movie" m ON aa.movie_id = m.movie_id  
             WHERE aa.award_id = $1  
               
             UNION ALL  
               
             SELECT   
                'Director' as winner_type,  
                CONCAT(p.first_name, ' ', p.last_name) as winner_name,  
                ad.category,  
                m.title as person_name  
             FROM "Award_Director" ad  
             JOIN "Director" d ON ad.director_id = d.director_id  
             JOIN "Person" p ON d.person_id = p.person_id  
             JOIN "Movie" m ON ad.movie_id = m.movie_id  
             WHERE ad.award_id = $1  
               
             ORDER BY winner_type, winner_name`,
            [awardId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching award winners:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete a genre from a movie
router.delete('/movie-genre/:movieId/:genreId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId, genreId } = req.params;
    try {
        // Check if the genre exists for the movie
        const checkGenre = await pool.query(
            'SELECT * FROM "Movie_Genre" WHERE movie_id = $1 AND genre_id = $2',
            [movieId, genreId]
        );

        if (checkGenre.rows.length === 0) {
            return res.status(404).json({ error: 'Genre not found for this movie' });
        }

        // Delete the genre from the movie
        await pool.query(
            'DELETE FROM "Movie_Genre" WHERE movie_id = $1 AND genre_id = $2',
            [movieId, genreId]
        );

        res.json({ message: 'Genre removed from movie successfully' });
    } catch (error) {
        console.error('Error removing genre from movie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete a role from a movie
router.delete('/movie-role/:movieId/:roleId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId, roleId } = req.params;
    try {
        // Check if the role exists for the movie
        const checkRole = await pool.query(
            'SELECT * FROM "Role" WHERE movie_id = $1 AND role_id = $2',
            [movieId, roleId]
        );

        if (checkRole.rows.length === 0) {
            return res.status(404).json({ error: 'Role not found for this movie' });
        }

        // Delete the role from the movie
        await pool.query(
            'DELETE FROM "Role" WHERE movie_id = $1 AND role_id = $2',
            [movieId, roleId]
        );

        res.json({ message: 'Role removed from movie successfully' });
    } catch (error) {
        console.error('Error removing role from movie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete a director from a movie
router.delete('/movie-director/:movieId/:directorId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId, directorId } = req.params;
    try {
        // Check if the director exists for the movie
        const checkDirector = await pool.query(
            'SELECT * FROM "Movie_Director" WHERE movie_id = $1 AND director_id = $2',
            [movieId, directorId]
        );

        if (checkDirector.rows.length === 0) {
            return res.status(404).json({ error: 'Director not found for this movie' });
        }

        // Delete the director from the movie
        await pool.query(
            'DELETE FROM "Movie_Director" WHERE movie_id = $1 AND director_id = $2',
            [movieId, directorId]
        );

        res.json({ message: 'Director removed from movie successfully' });
    } catch (error) {
        console.error('Error removing director from movie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete a writer from a movie
router.delete('/movie-writer/:movieId/:writerId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId, writerId } = req.params;
    try {
        // Check if the writer exists for the movie
        const checkWriter = await pool.query(
            'SELECT * FROM "Movie_Writer" WHERE movie_id = $1 AND writer_id = $2',
            [movieId, writerId]
        );

        if (checkWriter.rows.length === 0) {
            return res.status(404).json({ error: 'Writer not found for this movie' });
        }

        // Delete the writer from the movie
        await pool.query(
            'DELETE FROM "Movie_Writer" WHERE movie_id = $1 AND writer_id = $2',
            [movieId, writerId]
        );

        res.json({ message: 'Writer removed from movie successfully' });
    } catch (error) {
        console.error('Error removing writer from movie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete a movie
router.delete('/movies/:movieId', authorize, getUserInfo, requireAdmin, async (req, res) => {
    const { movieId } = req.params;
    try {
        // Check if the movie exists
        const checkMovie = await pool.query(
            'SELECT * FROM "Movie" WHERE movie_id = $1',
            [movieId]
        );

        if (checkMovie.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Delete the movie
        await pool.query(
            'DELETE FROM "Movie" WHERE movie_id = $1',
            [movieId]
        );

        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;