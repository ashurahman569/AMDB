const express = require('express');  
const pool = require('../db');  
const router = express.Router();  
  
// POST /addtowatch - Add movie to user's watchlist  
router.post('/addtowatch', async (req, res) => {  
  const { movie_id, user_id } = req.body;  
    
  // Validate input  
  if (!user_id) {  
    return res.status(400).json({   
      error: 'User_id is required'   
    });  
  }  
  
  try {  
    // Insert into watchlist table  
    const result = await pool.query(  
      'INSERT INTO "Watchlist" (user_id, movie_id) VALUES ($1, $2) RETURNING *',  
      [user_id, movie_id]  
    );  
  
    res.status(201).json({  
      success: true,  
      message: 'Movie added to watchlist successfully',  
      data: result.rows[0]  
    });  
  
  } catch (error) {  
    // Handle duplicate entry error (unique constraint violation)  
    if (error.code === '23505') {  
      return res.status(409).json({  
        error: 'Movie is already in your watchlist'  
      });  
    }  
      
    // Handle foreign key constraint violations  
    if (error.code === '23503') {  
      return res.status(400).json({  
        error: 'Invalid user_id or movie_id'  
      });  
    }  
  
    console.error('Error adding to watchlist:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});
  
// POST /addtofav - Add movie to user's favourites  
router.post('/addtofav', async (req, res) => {  
  const { movie_id, user_id } = req.body;  
    
  // Validate input  
  if (!movie_id || !user_id) {  
    return res.status(400).json({   
      error: 'Both movie_id and user_id are required'   
    });  
  }  
  
  try {  
    // Insert into favourites table  
    const result = await pool.query(  
      'INSERT INTO "Favourites" (user_id, movie_id) VALUES ($1, $2) RETURNING *',  
      [user_id, movie_id]  
    );  
  
    res.status(201).json({  
      success: true,  
      message: 'Movie added to favourites successfully',  
      data: result.rows[0]  
    });  
  
  } catch (error) {  
    // Handle duplicate entry error (unique constraint violation)  
    if (error.code === '23505') {  
      return res.status(409).json({  
        error: 'Movie is already in your favourites'  
      });  
    }  
      
    // Handle foreign key constraint violations  
    if (error.code === '23503') {  
      return res.status(400).json({  
        error: 'Invalid user_id or movie_id'  
      });  
    }  
  
    console.error('Error adding to favourites:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});  
  
// GET /checkinwatchlist - Check if movie is in user's watchlist  
router.get('/checkinwatchlist', async (req, res) => {  
  const { movie_id, user_id } = req.query;  
    
  // Validate input  
  if (!movie_id || !user_id) {  
    return res.status(400).json({   
      error: 'Both movie_id and user_id are required'   
    });  
  }  
  
  try {  
    // Check if movie exists in watchlist  
    const result = await pool.query(  
      'SELECT * FROM "Watchlist" WHERE user_id = $1 AND movie_id = $2',  
      [user_id, movie_id]  
    );  
  
    res.status(200).json({  
      success: true,  
      inWatchlist: result.rows.length > 0,  
      data: result.rows.length > 0 ? result.rows[0] : null  
    });  
  
  } catch (error) {  
    console.error('Error checking watchlist:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});  
  
// GET /checkinfav - Check if movie is in user's favourites  
router.get('/checkinfav', async (req, res) => {  
  const { movie_id, user_id } = req.query;  
    
  // Validate input  
  if (!movie_id || !user_id) {  
    return res.status(400).json({   
      error: 'Both movie_id and user_id are required'   
    });  
  }  
  
  try {  
    // Check if movie exists in favourites  
    const result = await pool.query(  
      'SELECT * FROM "Favourites" WHERE user_id = $1 AND movie_id = $2',  
      [user_id, movie_id]  
    );  
  
    res.status(200).json({  
      success: true,  
      inFavourites: result.rows.length > 0,  
      data: result.rows.length > 0 ? result.rows[0] : null  
    });  
  
  } catch (error) {  
    console.error('Error checking favourites:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});  
  
// DELETE /removefromlist - Remove movie from user's watchlist  
router.delete('/removefromlist', async (req, res) => {  
  const { movie_id, user_id } = req.body;  
    
  // Validate input  
  if (!movie_id || !user_id) {  
    return res.status(400).json({   
      error: 'Both movie_id and user_id are required'   
    });  
  }  
  
  try {  
    // Delete from watchlist table  
    const result = await pool.query(  
      'DELETE FROM "Watchlist" WHERE user_id = $1 AND movie_id = $2 RETURNING *',  
      [user_id, movie_id]  
    );  
  
    // Check if any row was deleted  
    if (result.rows.length === 0) {  
      return res.status(404).json({  
        error: 'Movie not found in your watchlist'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      message: 'Movie removed from watchlist successfully',  
      data: result.rows[0]  
    });  
  
  } catch (error) {  
    console.error('Error removing from watchlist:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});  
  
// DELETE /removefromfav - Remove movie from user's favourites  
router.delete('/removefromfav', async (req, res) => {  
  const { movie_id, user_id } = req.body;  
    
  // Validate input  
  if (!movie_id || !user_id) {  
    return res.status(400).json({   
      error: 'Both movie_id and user_id are required'   
    });  
  }  
  
  try {  
    // Delete from favourites table  
    const result = await pool.query(  
      'DELETE FROM "Favourites" WHERE user_id = $1 AND movie_id = $2 RETURNING *',  
      [user_id, movie_id]  
    );  
  
    // Check if any row was deleted  
    if (result.rows.length === 0) {  
      return res.status(404).json({  
        error: 'Movie not found in your favourites'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      message: 'Movie removed from favourites successfully',  
      data: result.rows[0]  
    });  
  
  } catch (error) {  
    console.error('Error removing from favourites:', error);  
    res.status(500).json({  
      error: 'Internal server error'  
    });  
  }  
});  

//GET /watchlist/:userId - Get user's watchlist
router.get('/watchlist/:userId', async (req, res) => {  
  const { userId } = req.params;

  // Validate input
  if (!userId) {
    return res.status(400).json({
      error: 'User ID is required'
    });
  }

  // Validate userId is a number
  if (isNaN(parseInt(userId))) {
    return res.status(400).json({
      error: 'User ID must be a valid number'
    });
  }

  try {
    console.log('Fetching watchlist for user:', userId);
    
    // First check if user exists
    const userCheck = await pool.query(
      'SELECT user_id FROM "User" WHERE user_id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Fetch watchlist for the user with all required fields
    const result = await pool.query(
      `SELECT 
        m.movie_id, 
        m.title, 
        m.release_date, 
        m.runtime,
        m.about, 
        m.poster_url, 
        m.mpaa_rating,
        m.box_office,
        m.budget,
        m.plot,
        m.trailer_url,
        w.added_date,
        STRING_AGG(DISTINCT g.name, ', ' ORDER BY g.name) as genres,
        COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
       FROM "Watchlist" w
       JOIN "Movie" m ON w.movie_id = m.movie_id
       LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
       LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
       LEFT JOIN "Review" r ON m.movie_id = r.movie_id
       WHERE w.user_id = $1
       GROUP BY m.movie_id, m.title, m.release_date, m.runtime, m.about, m.poster_url, m.mpaa_rating, m.box_office, m.budget, m.plot, m.trailer_url, w.added_date
       ORDER BY w.added_date ASC`,
      [userId]
    );

    console.log('Watchlist query result:', result.rows.length, 'movies found');

    // Transform the data to match desired format
    const transformedData = result.rows.map(row => ({
      about: row.about || "",
      avg_rating: parseFloat(row.avg_rating).toFixed(1),
      box_office: row.box_office || "0",
      budget: row.budget || "0",
      genres: row.genres || "",
      movie_id: row.movie_id,
      mpaa_rating: row.mpaa_rating || "",
      plot: row.plot || "",
      poster_url: row.poster_url || "",
      release_date: row.release_date,
      review_count: row.review_count.toString(),
      runtime: row.runtime,
      title: row.title,
      trailer_url: row.trailer_url || ""
    }));

    res.status(200).json({
      success: true,
      count: transformedData.length,
      data: transformedData
    });

  } catch (error) {
    console.error('Error fetching watchlist:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

//GET /favourites/:userId - Get user's favourites
router.get('/favourites/:userId', async (req, res) => {
  const { userId } = req.params;

  // Validate input
  if (!userId) {
    return res.status(400).json({
      error: 'User ID is required'
    });
  }

  // Validate userId is a number
  if (isNaN(parseInt(userId))) {
    return res.status(400).json({
      error: 'User ID must be a valid number'
    });
  }

  try {
    console.log('Fetching favourites for user:', userId);
    
    // First check if user exists
    const userCheck = await pool.query(
      'SELECT user_id FROM "User" WHERE user_id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Fetch favourites for the user with all required fields
    const result = await pool.query(
      `SELECT 
        m.movie_id, 
        m.title, 
        m.release_date, 
        m.runtime,
        m.about, 
        m.poster_url, 
        m.mpaa_rating,
        m.box_office,
        m.budget,
        m.plot,
        m.trailer_url,
        f.added_date,
        STRING_AGG(DISTINCT g.name, ', ' ORDER BY g.name) as genres,
        COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
       FROM "Favourites" f
       JOIN "Movie" m ON f.movie_id = m.movie_id
       LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
       LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
       LEFT JOIN "Review" r ON m.movie_id = r.movie_id
       WHERE f.user_id = $1
       GROUP BY m.movie_id, m.title, m.release_date, m.runtime, m.about, m.poster_url, m.mpaa_rating, m.box_office, m.budget, m.plot, m.trailer_url, f.added_date
       ORDER BY f.added_date ASC`,
      [userId]
    );

    console.log('Favourites query result:', result.rows.length, 'movies found');

    // Transform the data to match desired format
    const transformedData = result.rows.map(row => ({
      about: row.about || "",
      avg_rating: parseFloat(row.avg_rating).toFixed(1),
      box_office: row.box_office || "0",
      budget: row.budget || "0",
      genres: row.genres || "",
      movie_id: row.movie_id,
      mpaa_rating: row.mpaa_rating || "",
      plot: row.plot || "",
      poster_url: row.poster_url || "",
      release_date: row.release_date,
      review_count: row.review_count.toString(),
      runtime: row.runtime,
      title: row.title,
      trailer_url: row.trailer_url || ""
    }));

    res.status(200).json({
      success: true,
      count: transformedData.length,
      data: transformedData
    });

  } catch (error) {
    console.error('Error fetching favourites:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
module.exports = router;