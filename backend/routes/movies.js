const express = require('express');
const pool = require('../db');
const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE parameterized routes

// GET /api/movies/featured - Get 10 most popular movies of current year (NEW)
router.get('/featured', async (req, res) => {
  try {
    const movies = await getFeaturedMovies();

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured movies'
    });
  }
});

// GET /api/movies/popular - Get popular movies (MOVED UP)
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const movies = await getMoviesByPopularity(limit);

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular movies'
    });
  }
});

// GET /api/movies/new - Get newly released movies (MOVED UP)
router.get('/new', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    // Get movies released within the last 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const query = `
      SELECT 
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
      FROM "Movie" m
      LEFT JOIN "Review" r ON m.movie_id = r.movie_id
      LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
      LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
      WHERE m.release_date >= $1
      GROUP BY m.movie_id
      ORDER BY m.release_date DESC
      LIMIT 10
    `;
    const movies = await pool.query(query, [oneMonthAgo]);
    res.json({
      success: true,
      count: movies.rows.length,
      data: movies.rows
    });
  } catch (error) {
    console.error('Error fetching newly released movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching newly released movies'
    });
  }
});

// GET /api/movies/boxoffice - Get top box office movies (MOVED UP)
router.get('/boxoffice', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const movies = await getMoviesByBoxOffice(limit);

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching box office movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching box office movies'
    });
  }
});

// GET /api/movies/genre/:genreName - Get movies by genre (MOVED UP)
router.get('/genre/:genreName', async (req, res) => {
  try {
    const { genreName } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const movies = await getMoviesByGenre(genreName, limit);

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies by genre'
    });
  }
});

// GET /api/movies/year/:year - Get movies by year (MOVED UP)
router.get('/year/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const movies = await getMoviesByYear(parseInt(year), limit);

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching movies by year:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies by year'
    });
  }
});

// GET /api/movies - Search and filter movies
router.get('/', async (req, res) => {
  try {
    const {
      search,
      genre,
      year,
      sortBy = 'title', // Default sort by title
      order = 'ASC'     // Default ascending order
    } = req.query;

    const movies = await searchMovies({
      search,
      genre,
      year,
      sortBy,
      order
    });

    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies'
    });
  }
});

// GET /api/movies/:id - Get single movie by ID (MOVED DOWN - must be last)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await getMovieById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movie',
    });
  }
});

// Get 10 featured movies (most popular movies of current year based on release_date)
async function getFeaturedMovies() {
  const currentYear = new Date().getFullYear();

  const query = `
    SELECT 
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    WHERE EXTRACT(YEAR FROM m.release_date) = $1
    GROUP BY m.movie_id
    HAVING COUNT(DISTINCT r.review_id) > 0
    ORDER BY AVG(DISTINCT r.rating) DESC, COUNT(DISTINCT r.review_id) DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [currentYear]);
  return result.rows;
}

// Main search function with filters and sorting
async function searchMovies({ search, genre, year, sortBy, order }) {
  let query = `
    SELECT DISTINCT 
      m.movie_id,
      m.title,
      m.release_date,
      m.runtime,
      m.about,
      m.plot,
      m.mpaa_rating,
      m.budget,
      m.box_office,
      m.poster_url,
      m.trailer_url,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT all_genres.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    -- Join for getting ALL genres (for display)
    LEFT JOIN "Movie_Genre" all_mg ON m.movie_id = all_mg.movie_id
    LEFT JOIN "Genre" all_genres ON all_mg.genre_id = all_genres.genre_id
  `;

  const conditions = [];
  const values = [];
  let paramCount = 0;
  let searchParamIndex = null;

  // Search by movie title
  if (search) {
    paramCount++;
    searchParamIndex = paramCount;
    conditions.push(`m.title ILIKE ${paramCount}`);
    values.push(`%${search}%`);
  }

  // Filter by year (using release_date)
  if (year) {
    paramCount++;
    conditions.push(`EXTRACT(YEAR FROM m.release_date) = $${paramCount}`);
    values.push(parseInt(year));
  }

  // Filter by genre - use EXISTS subquery instead of JOIN
  if (genre) {
    paramCount++;
    conditions.push(`EXISTS (
      SELECT 1 
      FROM "Movie_Genre" filter_mg 
      JOIN "Genre" filter_g ON filter_mg.genre_id = filter_g.genre_id 
      WHERE filter_mg.movie_id = m.movie_id 
      AND filter_g.name ILIKE $${paramCount}
    )`);
    values.push(`%${genre}%`);
  }

  // Add WHERE clause if there are conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Group by for aggregation
  query += `
    GROUP BY m.movie_id, m.title, m.release_date, m.runtime, m.about, m.plot, 
             m.mpaa_rating, m.budget, m.box_office, m.poster_url, m.trailer_url
  `;

  // Add sorting - prioritize exact matches first, then apply user sorting
  if (search && searchParamIndex) {
    query += ` ORDER BY 
      CASE 
        WHEN UPPER(m.title) = UPPER(${searchParamIndex}) THEN 1 
        ELSE 2 
      END,
      ${getSortClause(sortBy)} ${order.toUpperCase()}`;
  } else {
    query += ` ORDER BY ${getSortClause(sortBy)} ${order.toUpperCase()}`;
  }

  const result = await pool.query(query, values);
  return result.rows;
}

// Get single movie with full details
async function getMovieById(id) {
  const query = `
    SELECT 
      m.*,
      TO_CHAR(m.release_date, 'DD Mon YYYY') as release_date,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    WHERE m.movie_id = $1
    GROUP BY m.movie_id
  `;
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;

  const movie = result.rows[0];

  // Convert values to correct types
  movie.avg_rating = Math.round(parseFloat(movie.avg_rating) * 10) / 10;
  movie.review_count = parseInt(movie.review_count);
  movie.budget = movie.budget ? parseFloat(movie.budget) : null;
  movie.box_office = movie.box_office ? parseFloat(movie.box_office) : null;
  movie.runtime = movie.runtime ? parseInt(movie.runtime) : null;

  // Get cast
  const castRes = await pool.query(`
    SELECT 
      p.person_id, p.first_name, p.last_name, p.photo_url, r.character_name
    FROM "Role" r
    JOIN "Actor" a ON r.actor_id = a.actor_id
    JOIN "Person" p ON a.person_id = p.person_id
    WHERE r.movie_id = $1
    ORDER BY p.last_name
  `, [id]);
  movie.cast = castRes.rows;

  // Get directors
  const directorRes = await pool.query(`
    SELECT 
      p.person_id, p.first_name, p.last_name, p.photo_url
    FROM "Movie_Director" md
    JOIN "Director" d ON md.director_id = d.director_id
    JOIN "Person" p ON d.person_id = p.person_id
    WHERE md.movie_id = $1
  `, [id]);
  movie.directors = directorRes.rows;

  // Get writers
  const writerRes = await pool.query(`
    SELECT 
      p.person_id, p.first_name, p.last_name, p.photo_url
    FROM "Movie_Writer" mw
    JOIN "Writer" w ON mw.writer_id = w.writer_id
    JOIN "Person" p ON w.person_id = p.person_id
    WHERE mw.movie_id = $1
  `, [id]);
  movie.writers = writerRes.rows;

  return movie;
}

// Get movies sorted by popularity (average rating)
async function getMoviesByPopularity(limit = 100) {
  const query = `
    SELECT 
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    GROUP BY m.movie_id
    HAVING COUNT(DISTINCT r.review_id) > 0
    ORDER BY AVG(DISTINCT r.rating) DESC, COUNT(DISTINCT r.review_id) DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

// Get movies sorted by box office
async function getMoviesByBoxOffice(limit = 100) {
  const query = `
    SELECT 
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    WHERE m.box_office IS NOT NULL AND m.box_office > 0
    GROUP BY m.movie_id
    ORDER BY m.box_office DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

// Get movies by specific genre
async function getMoviesByGenre(genreName, limit = 100) {
  const query = `
    SELECT DISTINCT
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    WHERE g.name ILIKE $1
    GROUP BY m.movie_id
    ORDER BY m.title
    LIMIT $2
  `;

  const result = await pool.query(query, [`%${genreName}%`, limit]);
  return result.rows;
}

// Get movies by year (using release_date)
async function getMoviesByYear(year, limit = 100) {
  const query = `
    SELECT 
      m.*,
      COALESCE(AVG(DISTINCT r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.review_id) as review_count,
      STRING_AGG(DISTINCT g.name, ', ') as genres
    FROM "Movie" m
    LEFT JOIN "Review" r ON m.movie_id = r.movie_id
    LEFT JOIN "Movie_Genre" mg ON m.movie_id = mg.movie_id
    LEFT JOIN "Genre" g ON mg.genre_id = g.genre_id
    WHERE EXTRACT(YEAR FROM m.release_date) = $1
    GROUP BY m.movie_id
    ORDER BY m.title
    LIMIT $2
  `;

  const result = await pool.query(query, [year, limit]);
  return result.rows;
}

// Helper function to get sort clause
function getSortClause(sortBy) {
  switch (sortBy.toLowerCase()) {
    case 'popularity':
    case 'rating':
      return 'avg_rating';
    case 'boxoffice':
    case 'box_office':
      return 'm.box_office';
    case 'year':
      return 'EXTRACT(YEAR FROM m.release_date)';
    case 'release_date':
      return 'm.release_date';
    case 'title':
    default:
      return 'm.title';
  }
}

module.exports = router;