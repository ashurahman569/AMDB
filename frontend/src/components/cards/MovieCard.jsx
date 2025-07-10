// components/cards/MovieCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  if (!movie) return null;
  const handleClick = () => {
    navigate(`/movie/${movie.movie_id}`); // navigate to movie details page
  };


  // Extract year from release_date
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
      

  return (
    <div onClick={handleClick} className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:scale-105 shadow-md text-white w-64">
      <img
        src={movie.poster_url || '/fallback.jpg'}
        alt={movie.title || 'Untitled'}
        className="w-full h-96 object-cover"
      />
      <div className="p-3">
        <h3 className="text-lg font-semibold">{movie.title}</h3>
        <p className="text-sm">{year}</p>
        <p className="text-xs text-gray-300">{movie.genres}</p>
      </div>
    </div>
  );
};

export default MovieCard;
