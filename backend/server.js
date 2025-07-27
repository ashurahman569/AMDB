const express = require('express');
const cors = require('cors');
const movieRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const peopleRoutes = require('./routes/people');
const genreRoutes = require('./routes/genres');
const userRoutes = require('./routes/user');
const awardRoutes = require('./routes/awards'); 
const adminRoutes = require('./routes/admin');
const validInfo = require('./middleware/validinfo');
const authorize = require('./middleware/authorize');
const pool = require('./db');
require('dotenv').config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.use('/api/movies', movieRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/user', userRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));