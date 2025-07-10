import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MovieGrid from '../components/cards/MovieGrid'; // Import your MovieGrid component

const BASE_URL = "http://localhost:5000/api";

const Search = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ year: '', genre: '' });
  const [tempFilters, setTempFilters] = useState({ year: '', genre: '' }); // Temporary filters before applying
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate years array from 2025 to 1990
  const years = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => 2025 - i);

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
          console.log(res.data); // Debug API response
          const movies = Array.isArray(res.data?.data) ? res.data.data : [];
          setResults(movies);
        } catch (err) {
          console.error('Error fetching movies:', err);
          setResults([]); // Reset results on error
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          Search Results {query && `for "${query}"`}
        </h2>
        
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-end">
          {/* Year Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-2">Year</label>
            <select
              name="year"
              value={tempFilters.year}
              onChange={updateTempFilter}
              className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 min-w-[120px]"
            >
              <option value="">---</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-2">Genre</label>
            <select
              name="genre"
              value={tempFilters.genre}
              onChange={updateTempFilter}
              className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 min-w-[150px] max-h-60"
              size="1"
            >
              <option value="">---</option>
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
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors duration-200"
          >
            Apply Filters
          </button>
        </div>

        {/* Active Filters Display */}
        {(filters.year || filters.genre) && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-gray-300">Active filters:</span>
            {filters.year && (
              <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-sm">
                Year: {filters.year}
              </span>
            )}
            {filters.genre && (
              <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-sm">
                Genre: {filters.genre}
              </span>
            )}
            <button
              onClick={() => {
                setFilters({ year: '', genre: '' });
                setTempFilters({ year: '', genre: '' });
              }}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-lg">Searching movies...</p>
          </div>
        )}

        {/* Results List */}
        {!loading && (
          <>
            {results.length > 0 ? (
              <>
                <p className="text-lg mb-6 text-gray-300">
                  Found {results.length} movie{results.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {results.map((movie, index) => (
                    <MovieGrid key={movie.id} movie={movie} index={index + 1} />
                  ))}
                </div>
              </>
            ) : query && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-400">No movies found for "{query}"</p>
                <p className="text-gray-500 mt-2">Try adjusting your search terms or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;