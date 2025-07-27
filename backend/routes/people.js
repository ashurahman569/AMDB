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

router.get('/:person_id', async (req, res) => {
  try {
    const personId = req.params.person_id;
    const query = 'SELECT * FROM "Person" WHERE person_id = $1';
    const result = await pool.query(query, [personId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching person'
    });
  }
});

// Get all movies a person has worked on (as actor, director, or writer)
router.get('/:person_id/movies', async (req, res) => {
  try {
    const personId = req.params.person_id;
    const movies = await getPersonMovies(personId);
    
    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching person movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching person movies'
    });
  }
});

async function getPersonMovies(personId) {
  const query = `
    WITH person_movies AS (
      -- Movies as Actor
      SELECT 
        m.movie_id,
        m.title,
        m.release_date,
        m.poster_url,
        'Actor' as role_type,
        r.character_name
      FROM "Movie" m
      JOIN "Role" r ON m.movie_id = r.movie_id
      JOIN "Actor" a ON r.actor_id = a.actor_id
      WHERE a.person_id = $1
      
      UNION
      
      -- Movies as Director
      SELECT 
        m.movie_id,
        m.title,
        m.release_date,
        m.poster_url,
        'Director' as role_type,
        NULL as character_name
      FROM "Movie" m
      JOIN "Movie_Director" md ON m.movie_id = md.movie_id
      JOIN "Director" d ON md.director_id = d.director_id
      WHERE d.person_id = $1
      
      UNION
      
      -- Movies as Writer
      SELECT 
        m.movie_id,
        m.title,
        m.release_date,
        m.poster_url,
        'Writer' as role_type,
        NULL as character_name
      FROM "Movie" m
      JOIN "Movie_Writer" mw ON m.movie_id = mw.movie_id
      JOIN "Writer" w ON mw.writer_id = w.writer_id
      WHERE w.person_id = $1
    )
    SELECT 
      movie_id,
      title,
      release_date,
      poster_url,
      ARRAY_AGG(DISTINCT role_type) as roles,
      ARRAY_AGG(DISTINCT character_name) FILTER (WHERE character_name IS NOT NULL) as characters
    FROM person_movies
    GROUP BY movie_id, title, release_date, poster_url
    ORDER BY release_date DESC NULLS LAST, title;
  `;
  
  const result = await pool.query(query, [personId]);
  return result.rows;
}

// Get all awards a person has received
router.get('/:person_id/awards', async (req, res) => {
  try {
    const personId = req.params.person_id;
    const awards = await getPersonAwards(personId);
    
    res.json({
      success: true,
      count: awards.length,
      data: awards
    });
  } catch (error) {
    console.error('Error fetching person awards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching person awards'
    });
  }
});

async function getPersonAwards(personId) {
  const query = `
    WITH person_awards AS (
      -- Awards as Actor
      SELECT 
        a.name as award_name,
        a.year,
        aa.category,
        m.title as movie_title,
        'Actor' as role_type
      FROM "Award" a
      JOIN "Award_Actor" aa ON a.award_id = aa.award_id
      JOIN "Actor" act ON aa.actor_id = act.actor_id
      JOIN "Movie" m ON aa.movie_id = m.movie_id
      WHERE act.person_id = $1
      
      UNION
      
      -- Awards as Director
      SELECT 
        a.name as award_name,
        a.year,
        ad.category,
        m.title as movie_title,
        'Director' as role_type
      FROM "Award" a
      JOIN "Award_Director" ad ON a.award_id = ad.award_id
      JOIN "Director" d ON ad.director_id = d.director_id
      JOIN "Movie" m ON ad.movie_id = m.movie_id
      WHERE d.person_id = $1
    )
    SELECT 
      CASE 
        WHEN category IS NOT NULL AND movie_title IS NOT NULL THEN
          award_name || ' (' || year || ') - ' || category || ' for "' || movie_title || '"'
        WHEN category IS NOT NULL THEN
          award_name || ' (' || year || ') - ' || category
        WHEN movie_title IS NOT NULL THEN
          award_name || ' (' || year || ') for "' || movie_title || '"'
        ELSE
          award_name || ' (' || year || ')'
      END as award
    FROM person_awards
    ORDER BY year DESC, award_name;
  `;
  
  const result = await pool.query(query, [personId]);
  return result.rows;
}

module.exports = router;