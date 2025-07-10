import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

const MovieGrid = ({ movie,index}) => {
  const navigate = useNavigate();

  if (!movie) return null;

  const handleClick = () => {
    navigate(`/movie/${movie.movie_id}`); // navigate to movie details page
  };
  // Extract year from release_date
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-4 p-4 border border-black-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-gray-800 text-white w-full max-w-5xl"
    >
      {/* Movie Poster */}
      <div className="w-20 h-30 flex-shrink-0">
        <img
          src={movie.poster_url || '/fallback.jpg'}
          alt={movie.title || 'Untitled'}
          className="w-full h-full object-cover rounded"
        />
      </div>

      {/* Movie Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-large text-white-900 mb-1 py-2">
            {/* <span className="text-gray-600 mr-2">{index}.</span> */}
            {movie.title}
            </h3>

            <div className="flex items-center gap-3 text-m text-white-600 mb-2">
              <span>{year}</span>
              {movie.runtime && <span>   {movie.runtime} min</span>}
              <span className="px-1 text-m">
                   {parseFloat(movie.avg_rating).toFixed(1)}/10
              </span>
            </div>

            {/* Genres */}
            {movie.genres && (
              <p className="text-m text-gray-500 mt-2">{movie.genres}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieGrid;
