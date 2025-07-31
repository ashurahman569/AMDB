import React from 'react';  
import { useNavigate } from 'react-router-dom';  
import { Star, Clock, Calendar, Film } from 'lucide-react';  
  
const MovieGrid = ({ movie, index }) => {  
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
      className="group relative flex items-start gap-6 p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-blue-500/30 hover:shadow-2xl transition-all duration-500 cursor-pointer w-full max-w-5xl hover:scale-[1.02] overflow-hidden"  
    >  
      {/* Gradient Overlay for Hover Effect */}  
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />  
        
      {/* Glow Effect */}  
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />  
  
      {/* Movie Poster */}  
      <div className="relative w-24 h-36 flex-shrink-0 overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300">  
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />  
        {movie.poster_url ? (  
          <img  
            src={movie.poster_url}  
            alt={movie.title || 'Untitled'}  
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"  
          />  
        ) : (  
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">  
            <Film size={24} className="text-slate-400 group-hover:text-blue-300 transition-colors duration-300" />  
          </div>  
        )}  
          
        {/* Rating Badge */}  
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">  
          <div className="flex items-center gap-1">  
            <Star size={12} className="text-amber-400 fill-current" />  
            <span className="text-white text-xs font-medium">  
              {parseFloat(movie.avg_rating).toFixed(1)}  
            </span>  
          </div>  
        </div>  
      </div>  
  
      {/* Movie Details */}  
      <div className="relative flex-1 min-w-0 space-y-3">  
        {/* Title */}  
        <div className="flex items-start justify-between">  
          <h3 className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300 leading-tight">  
            <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-white transition-all duration-300">  
              {movie.title}  
            </span>  
          </h3>  
        </div>  
  
        {/* Movie Info */}  
        <div className="flex items-center gap-4 text-slate-300">  
          <div className="flex items-center gap-2">  
            <Calendar size={16} className="text-blue-400" />  
            <span className="font-medium">{year}</span>  
          </div>  
            
          {movie.runtime && (  
            <div className="flex items-center gap-2">  
              <Clock size={16} className="text-green-400" />  
              <span className="font-medium">{movie.runtime} min</span>  
            </div>  
          )}  
            
          <div className="flex items-center gap-2 bg-slate-700/30 px-3 py-1 rounded-full border border-slate-600/30 group-hover:border-amber-400/30 transition-colors duration-300">  
            <Star size={14} className="text-amber-400 fill-current" />  
            <span className="font-semibold text-amber-200">  
              {parseFloat(movie.avg_rating).toFixed(1)}/10  
            </span>  
          </div>  
        </div>  
  
        {/* Genres */}  
        {movie.genres && (  
          <div className="flex flex-wrap gap-2">  
            {movie.genres.split(',').slice(0, 3).map((genre, idx) => (  
              <span   
                key={idx}  
                className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 text-sm rounded-full border border-purple-500/30 backdrop-blur-sm group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all duration-300"  
              >  
                {genre.trim()}  
              </span>  
            ))}  
            {movie.genres.split(',').length > 3 && (  
              <span className="text-slate-400 text-sm self-center">  
                +{movie.genres.split(',').length - 3} more  
              </span>  
            )}  
          </div>  
        )}  
  
        {/* Subtle underline effect */}  
        <div className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-24 transition-all duration-700 rounded-full" />  
      </div>  
  
      {/* Shimmer Effect */}  
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none" />  
    </div>  
  );  
};  
  
export default MovieGrid;