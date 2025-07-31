import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MovieGrid from '../components/cards/MovieGrid';
import { Search as SearchIcon, Filter, X, Calendar, Film, Sparkles, AlertTriangle } from 'lucide-react';

const BASE_URL = "http://localhost:5000/api";

const Search = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ year: '', genre: '' });
  const [tempFilters, setTempFilters] = useState({ year: '', genre: '' });
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate years array from 2025 to 1990  
  const years = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => 2025 - i);

  // Scroll to top when component mounts  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

  // Fetch genres on component mount  
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/genres/genres`);
        setGenres(res.data.data || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    if (query) {
      const fetchMovies = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${BASE_URL}/movies`, {
            params: {
              search: query,
              year: filters.year,
              genre: filters.genre,
            },
          });
          console.log(res.data);
          const movies = Array.isArray(res.data?.data) ? res.data.data : [];
          setResults(movies);
        } catch (err) {
          console.error('Error fetching movies:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      fetchMovies();
    }
  }, [query, filters]);

  const updateTempFilter = (e) => {
    setTempFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const clearAllFilters = () => {
    setFilters({ year: '', genre: '' });
    setTempFilters({ year: '', genre: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
              <SearchIcon className="text-blue-400" size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Search Results
            </h1>
          </div>
          {query && (
            <p className="text-xl text-slate-300">
              for <span className="text-blue-400 font-semibold">"{query}"</span>
            </p>
          )}
        </div>

        {/* Filters Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="text-purple-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Filters</h2>
            </div>

            <div className="flex flex-wrap gap-6 items-end">
              {/* Year Dropdown */}
              <div className="flex flex-col min-w-[140px]">
                <label className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  Year
                </label>
                <select
                  name="year"
                  value={tempFilters.year}
                  onChange={updateTempFilter}
                  className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm hover:border-slate-500/50"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre Dropdown */}
              <div className="flex flex-col min-w-[180px]">
                <label className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Film size={16} className="text-purple-400" />
                  Genre
                </label>
                <select
                  name="genre"
                  value={tempFilters.genre}
                  onChange={updateTempFilter}
                  className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 backdrop-blur-sm hover:border-slate-500/50"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre.genre_id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply Filter Button */}
              <button
                onClick={applyFilters}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Sparkles size={18} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.year || filters.genre) && (
          <div className="mb-8">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-300 font-medium">Active filters:</span>
                {filters.year && (
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-200 rounded-full text-sm border border-blue-500/30 backdrop-blur-sm flex items-center gap-2">
                    <Calendar size={14} />
                    Year: {filters.year}
                  </span>
                )}
                {filters.genre && (
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 rounded-full text-sm border border-purple-500/30 backdrop-blur-sm flex items-center gap-2">
                    <Film size={14} />
                    Genre: {filters.genre}
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-200 hover:text-red-100 rounded-full text-sm transition-all duration-200 border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm flex items-center gap-2"
                >
                  <X size={14} />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                <SearchIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} />
              </div>
              <p className="text-xl text-slate-300 font-medium">Searching movies...</p>
              <p className="text-slate-400 mt-2">Finding the perfect matches for you</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && (
          <>
            {results.length > 0 ? (
              <>
                {/* Results Count */}
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Film className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {results.length} movie{results.length !== 1 ? 's' : ''} found
                        </p>
                        <p className="text-slate-300">
                          {query && `Matching "${query}"`}
                          {(filters.year || filters.genre) && ' with applied filters'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="space-y-4">
                  {results.map((movie, index) => (
                    <div
                      key={movie.movie_id || index}
                      className="animate-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <MovieGrid movie={movie} index={index + 1} />
                    </div>
                  ))}
                </div>

                {/* Results Footer */}
                <div className="mt-12 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-full">
                    <Sparkles className="text-blue-400" size={16} />
                    <span className="text-slate-300">End of results</span>
                  </div>
                </div>
              </>
            ) : query && (
              /* No Results State */
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-600/50">
                    <AlertTriangle className="text-slate-400" size={40} />
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-4">No Movies Found</h3>
                  <p className="text-xl text-slate-300 mb-2">
                    No results for <span className="text-blue-400 font-semibold">"{query}"</span>
                  </p>
                  <p className="text-slate-400 mb-8">
                    Try adjusting your search terms or removing some filters
                  </p>

                  {/* Suggestions */}
                  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Search Tips:</h4>
                    <ul className="text-left text-slate-300 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Try different keywords or movie titles
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Remove year or genre filters
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Check for spelling mistakes
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        Try searching for actor or director names
                      </li>
                    </ul>
                  </div>

                  {(filters.year || filters.genre) && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Clear Filters & Search Again
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Initial State - No Query */}
        {!query && !loading && (
          <div className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30 backdrop-blur-sm">
                <SearchIcon className="text-blue-400" size={48} />
              </div>

              <h3 className="text-3xl font-bold text-white mb-4">Ready to Discover Movies?</h3>
              <p className="text-xl text-slate-300 mb-8">
                Use the search bar above to find your next favorite film
              </p>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={20} />
                  Search Features:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <SearchIcon size={16} className="text-blue-400" />
                    </div>
                    <span className="text-slate-300">Search by movie title</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Film size={16} className="text-purple-400" />
                    </div>
                    <span className="text-slate-300">Filter by genre</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-green-400" />
                    </div>
                    <span className="text-slate-300">Filter by year</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles size={16} className="text-amber-400" />
                    </div>
                    <span className="text-slate-300">Advanced filtering</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;