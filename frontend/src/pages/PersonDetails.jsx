import { useEffect, useState } from 'react';  
import { useParams, useNavigate } from 'react-router-dom';  
import axios from 'axios';  
import { Users, Award, Calendar, MapPin, Film, Star, ChevronLeft, ChevronRight, Clock, Eye, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';  
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
  
  // Scroll to top when component mounts or person_id changes  
  useEffect(() => {  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  }, [person_id]);  
  
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

  const scrollContainer = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const EnhancedMovieCard = ({ movie }) => (
    <div
      className="group relative w-56 h-80 cursor-pointer transition-all duration-500 hover:scale-105 flex-shrink-0"
      onClick={() => handleMovieClick(movie.movie_id)}
    >
      {/* Main Card */}
      <div className="relative w-full h-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/30">

        {/* Gradient Overlay for Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />

        {/* Poster Section */}
        <div className="relative h-4/5 overflow-hidden">
          {movie.poster_url ? (
            <>
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Photo Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300 border border-slate-600 group-hover:border-blue-400/30">
                <Film size={28} className="text-slate-400 group-hover:text-blue-300 transition-colors duration-300" />
              </div>
            </div>
          )}

          {/* Year Badge */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
            <span className="text-white text-xs font-medium">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="relative h-1/5 p-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10">
            <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-blue-100 transition-colors duration-300 truncate">
              {movie.title}
            </h3>

            {/* Roles */}
            {movie.roles && movie.roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {movie.roles.slice(0, 2).map((role, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 backdrop-blur-sm"
                  >
                    {role}
                  </span>
                ))}
                {movie.roles.length > 2 && (
                  <span className="text-slate-400 text-xs">+{movie.roles.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} />
          </div>
          <p className="text-xl text-slate-300">Loading person details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-xl text-slate-300">Person not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const age = calculateAge(person.birth_date, person.death_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Back Button */}
      <div className="relative max-w-7xl mx-auto px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all duration-200 hover:gap-3 mb-6 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Background with gradient overlay */}
        {person.photo_url && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${person.photo_url})`,
                filter: 'blur(20px) brightness(0.3)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Person Photo */}
            <div className="lg:col-span-1">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-full max-w-sm mx-auto lg:max-w-none aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  {person.photo_url ? (
                    <img
                      src={person.photo_url}
                      alt={`${person.first_name} ${person.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 relative">
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-8 left-8 w-12 h-12 border border-slate-400 rounded-full animate-pulse" />
                        <div className="absolute bottom-12 right-12 w-8 h-8 border border-slate-400 rounded-full animate-pulse delay-300" />
                        <div className="absolute top-1/2 right-12 w-6 h-6 border border-slate-400 rounded-full animate-pulse delay-700" />
                      </div>

                      <div className="relative z-10 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mb-6 mx-auto border border-slate-600">
                          <Users size={40} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-lg">No Photo Available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Person Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Name */}
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {person.first_name} {person.last_name}
                </h1>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Birth Date */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="text-green-400" size={20} />
                    <span className="text-slate-400 text-sm font-medium">BORN</span>
                  </div>
                  <div className="text-white font-semibold">
                    {formatDate(person.birth_date)}
                    {age && !person.death_date && (
                      <span className="text-slate-400 text-sm ml-2">({age} years old)</span>
                    )}
                  </div>
                </div>

                {/* Death Date */}
                {person.death_date && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="text-red-400" size={20} />
                      <span className="text-slate-400 text-sm font-medium">DIED</span>
                    </div>
                    <div className="text-white font-semibold">
                      {formatDate(person.death_date)}
                      {age && (
                        <span className="text-slate-400 text-sm ml-2">(aged {age})</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Birthplace */}
                {person.birthplace && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="text-blue-400" size={20} />
                      <span className="text-slate-400 text-sm font-medium">BIRTHPLACE</span>
                    </div>
                    <div className="text-white font-semibold">{person.birthplace}</div>
                  </div>
                )}

                {/* Movies Count */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Film className="text-purple-400" size={20} />
                    <span className="text-slate-400 text-sm font-medium">WORKS</span>
                  </div>
                  <div className="text-white font-semibold">{movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}</div>
                </div>

                {/* Awards Count */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="text-amber-400" size={20} />
                    <span className="text-slate-400 text-sm font-medium">AWARDS</span>
                  </div>
                  <div className="text-white font-semibold">{awards.length} {awards.length === 1 ? 'Award' : 'Awards'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Biography Section */}
        {person.biography && (
          <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="text-blue-400" size={28} />
              Biography
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-200 text-lg leading-relaxed">{person.biography}</p>
            </div>
          </section>
        )}

        {/* Works Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Film className="text-purple-400" size={28} />
            Filmography ({movies.length})
          </h2>

          {moviesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading filmography...</span>
            </div>
          ) : movies.length > 0 ? (
            <div className="relative group">
              <div className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2" id="movies-scroll">
                {movies.map(movie => (
                  <EnhancedMovieCard key={movie.movie_id} movie={movie} />
                ))}
              </div>

              {/* Navigation Arrows */}
              {movies.length > 4 && (
                <>
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm border border-slate-600/50"
                    onClick={() => scrollContainer('movies-scroll', 'left')}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm border border-slate-600/50"
                    onClick={() => scrollContainer('movies-scroll', 'right')}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No filmography information available</p>
            </div>
          )}
        </section>

        {/* Awards Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Award className="text-amber-400" size={28} />
            Awards & Recognition ({awards.length})
          </h2>

          {awardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading awards...</span>
            </div>
          ) : awards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awards.map((award, index) => (
                <div key={index} className="group flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30 hover:border-amber-400/30 transition-all duration-300 hover:bg-slate-700/20">
                  <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-slate-200 group-hover:text-white transition-colors duration-300">{award.award}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No award information available</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 
