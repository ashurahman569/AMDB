const express = require('express');  
const pool = require('../db');  
const router = express.Router();  
  
// Get all awards for a movie  
router.get('/movie/:movieId', async (req, res) => {      
    const { movieId } = req.params;  
      
    try {  
        const awards = await getAwardsByMovieId(movieId);  
          
        res.json({  
            success: true,  
            count: awards.length,  
            data: awards  
        });  
    } catch (error) {  
        console.error('Error fetching awards:', error);  
        res.status(500).json({  
            success: false,  
            message: 'Server error while fetching awards'  
        });  
    }  
});  
  
async function getAwardsByMovieId(movieId) {  
    const query = `  
        SELECT   
            ma.category || ' - ' || a.name || ' (' || a.year || ')' AS award              
        FROM "Award" a  
        JOIN "Award_Movie" ma ON a.award_id = ma.award_id  
        WHERE ma.movie_id = $1  
          
        UNION ALL  
          
        SELECT  
            p.first_name || ' ' || p.last_name || ' won ' || a.name || ' (' || a.year || ')' || ' for ' || ad.category || ' for this movie.' AS award  
        FROM "Award" a  
        JOIN "Award_Director" ad ON ad.award_id = a.award_id  
        JOIN "Director" d ON ad.director_id = d.director_id  
        JOIN "Person" p ON d.person_id = p.person_id  
        WHERE ad.movie_id = $1  
          
        UNION ALL  
          
        SELECT          
            p.first_name || ' ' || p.last_name || ' won ' || a.name || ' (' || a.year || ')' || ' for ' || aa.category || ' for this movie.' AS award  
        FROM "Award" a  
        JOIN "Award_Actor" aa ON aa.award_id = a.award_id  
        JOIN "Actor" ac ON aa.actor_id = ac.actor_id  
        JOIN "Person" p ON ac.person_id = p.person_id  
        WHERE aa.movie_id = $1  
          
        ORDER BY award  
    `;  
    const result = await pool.query(query, [movieId]);  
    return result.rows;  
}  
  
// Get all awards for a person  
router.get('/person/:personId', async (req, res) => {  
    const { personId } = req.params;  
      
    try {  
        const awards = await getAwardsByPersonId(personId);  
          
        res.json({  
            success: true,  
            count: awards.length,  
            data: awards  
        });  
    } catch (error) {  
        console.error('Error fetching awards:', error);  
        res.status(500).json({  
            success: false,  
            message: 'Server error while fetching awards'  
        });  
    }  
});  
  
async function getAwardsByPersonId(personId) {  
    const query = `  
        SELECT   
            ad.category || ' - ' || a.name || ' (' || a.year || ')' AS award             
        FROM "Award" a  
        JOIN "Award_Director" ad ON a.award_id = ad.award_id  
        JOIN "Director" d ON ad.director_id = d.director_id  
        WHERE d.person_id = $1  
          
        UNION ALL  
          
        SELECT          
            aa.category || ' - ' || a.name || ' (' || a.year || ')' AS award  
        FROM "Award" a  
        JOIN "Award_Actor" aa ON aa.award_id = a.award_id  
        JOIN "Actor" ac ON aa.actor_id = ac.actor_id  
        WHERE ac.person_id = $1  
          
        ORDER BY award  
    `;  
    const result = await pool.query(query, [personId]);  
    return result.rows;  
}  
  
module.exports = router;  