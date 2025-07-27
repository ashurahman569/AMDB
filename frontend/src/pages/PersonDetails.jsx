import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Award, Calendar, MapPin, Film } from 'lucide-react';
import MovieCard from '../components/cards/MovieCard';
const BASE_URL = 'http://localhost:5000/api';

export default function PersonDetails() {
  const { person_id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [awardsLoading, setAwardsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPersonDetails() {
      try {
        const res = await axios.get(`${BASE_URL}/people/${person_id}`);
        console.log("👤 Person data:", res.data.data);
        setPerson(res.data.data);
      } catch (err) {
        setError('Failed to fetch person details');
        console.error('Error fetching person:', err);
      } finally {
        setLoading(false);
      }
    }

    if (person_id) {
      fetchPersonDetails();
    }
  }, [person_id]);

  useEffect(() => {
    async function fetchPersonMovies() {
      try {
        const res = await axios.get(`${BASE_URL}/people/${person_id}/movies`);
        console.log("🎬 Person movies:", res.data.data);
        setMovies(res.data.data);
      } catch (err) {
        console.error('Error fetching person movies:', err);
        setMovies([]);
      } finally {
        setMoviesLoading(false);
      }
    }

    if (person_id) {
      fetchPersonMovies();
    }
  }, [person_id]);

  useEffect(() => {
    async function fetchPersonAwards() {
      try {
        const res = await axios.get(`${BASE_URL}/people/${person_id}/awards`);
        console.log("🏆 Person awards:", res.data.data);
        setAwards(res.data.data);
      } catch (err) {
        console.error('Error fetching person awards:', err);
        setAwards([]);
      } finally {
        setAwardsLoading(false);
      }
    }

    if (person_id) {
      fetchPersonAwards();
    }
  }, [person_id]);

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate, deathDate = null) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const MovieCard = ({ movie }) => (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:scale-105 border border-gray-600 flex-shrink-0 w-48"
      onClick={() => handleMovieClick(movie.movie_id)}
    >
      <div className="h-64 bg-gray-700 flex items-center justify-center text-gray-400">
        {movie.poster_url ? (
          <img 
            src={movie.poster_url} 
            alt={movie.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <Film size={32} />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
        <p className="text-gray-400 text-xs mt-1">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {movie.roles && movie.roles.map((role, index) => (
            <span 
              key={index}
              className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-center mt-10 text-white">Loading...</div>;
  if (error) return <div className="text-center text-red-400 mt-10">{error}</div>;
  if (!person) return <div className="text-center mt-10 text-white">Person not found.</div>;

  const age = calculateAge(person.birth_date, person.death_date);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex justify-center md:justify-start">
          <div className="w-80 h-96 bg-gray-800 rounded-xl overflow-hidden border border-gray-600">
            {person.photo_url ? (
              <img 
                src={person.photo_url} 
                alt={`${person.first_name} ${person.last_name}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Users size={64} />
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-4xl font-bold text-white">
            {person.first_name} {person.last_name}
          </h1>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Calendar size={18} className="text-blue-400" />
              <span>
                <strong>Born:</strong> {formatDate(person.birth_date)}
                {age && !person.death_date && (
                  <span className="text-gray-400 ml-2">({age} years old)</span>
                )}
              </span>
            </div>
            
            {person.death_date && (
              <div className="flex items-center gap-2 text-white">
                <Calendar size={18} className="text-red-400" />
                <span>
                  <strong>Died:</strong> {formatDate(person.death_date)}
                  {age && (
                    <span className="text-gray-400 ml-2">(aged {age})</span>
                  )}
                </span>
              </div>
            )}
            
            {person.birthplace && (
              <div className="flex items-center gap-2 text-white">
                <MapPin size={18} className="text-green-400" />
                <span><strong>Birthplace:</strong> {person.birthplace}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biography Section */}
      {person.biography && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Biography</h2>
          <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
            <p className="text-white leading-relaxed">{person.biography}</p>
          </div>
        </div>
      )}

      {/* Works Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
          <Film className="text-blue-400" size={24} />
          Works
        </h2>
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          {moviesLoading ? (
            <div className="text-center text-gray-400 py-8">Loading filmography...</div>
          ) : movies.length > 0 ? (
            <div className="relative group">
              <div className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2" id="movies-scroll">
                {movies.map(movie => (
                  <MovieCard key={movie.movie_id} movie={movie} />
                ))}
              </div>
              
              {/* Navigation Arrows */}
              {movies.length > 4 && (
                <>
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => {
                      const container = document.getElementById('movies-scroll');
                      container.scrollBy({ left: -300, behavior: 'smooth' });
                    }}
                  >
                    ←
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => {
                      const container = document.getElementById('movies-scroll');
                      container.scrollBy({ left: 300, behavior: 'smooth' });
                    }}
                  >
                    →
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No filmography information available
            </div>
          )}
        </div>
      </div>

      {/* Awards Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="text-yellow-400" size={24} />
          Awards & Recognition
        </h2>
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          {awardsLoading ? (
            <div className="text-center text-gray-400 py-4">Loading awards...</div>
          ) : awards.length > 0 ? (
            <ul className="space-y-2 text-white">
              {awards.map((award, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>{award.award}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No award information available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}