const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/genres', async (req, res) => {
  try {
    const genres= await getGenres();
    
    res.json({
      success: true,
      count: genres.length,
      data: genres
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching genres'
    });
  }
});

async function getGenres() {
  const query = `
    SELECT 
      g.genre_id,
      g.name
    FROM "Genre" g
  `;
  const result = await pool.query(query);
  return result.rows;
}

module.exports = router;