const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/borntoday', async (req, res) => {
  try {
    const people = await getPeopleBorn();
    
    res.json({
      success: true,
      count: people.length,
      data: people
    });
  } catch (error) {
    console.error('Error fetching people born today:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching people born today'
    });
  }
});

async function getPeopleBorn() {
    const currentdate = new Date();
    const currentDay = currentdate.getDate();
    const currentMonth = currentdate.getMonth() + 1; // getMonth() is zero-based
  
    const query = `
        SELECT * FROM "Person" p
        WHERE EXTRACT(MONTH FROM p.birth_date) = $1
            AND EXTRACT(DAY FROM p.birth_date) = $2
    `;

    const result = await pool.query(query, [currentMonth, currentDay]);
    return result.rows;
}

module.exports = router;