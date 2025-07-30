// components/cards/MovieCard.jsx  
import React from 'react';  
import { useNavigate } from 'react-router-dom';  
import { Star } from 'lucide-react';  
  
const MovieCard = ({ movie }) => {  
  const navigate = useNavigate();  
  
  if (!movie) return null;  
    
  const handleClick = () => {  
    navigate(`/movie/${movie.movie_id}`);  
  };  
  
  // Extract year from release_date  
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';  
  
  return (  
    <div   
      onClick={handleClick}   
      className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl text-white mx-auto"  
      style={{   
        width: '100%',   
        maxWidth: '280px',  
        minHeight: '420px'  
      }}  
    >  
      <div className="relative overflow-hidden">  
        <img  
          src={movie.poster_url || '/fallback.jpg'}  
          alt={movie.title || 'Untitled'}  
          className="w-full h-80 object-cover transition-transform duration-300 hover:scale-110"  
          style={{ aspectRatio: '2/3' }}  
        />  
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>  
      </div>  
      <div className="p-4">  
        <h3 className="text-lg font-semibold mb-1 line-clamp-2 min-h-[3.5rem]">  
          {movie.title}  
        </h3>  
        <p className="text-sm text-gray-300 mb-1 font-medium">{year}</p>  
        <p className="text-xs text-gray-400 line-clamp-2">  
          {movie.genres}  
        </p>  
      </div>  
    </div>  
  );  
};  
  
export default MovieCard;  