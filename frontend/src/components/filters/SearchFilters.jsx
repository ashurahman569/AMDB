import React from 'react';
import { Filter } from 'lucide-react';

const SearchFilters = ({ filters, onFiltersChange, onApplyFilters }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-yellow-400" />
        <h3 className="text-white font-semibold">Filters</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Genre</label>
          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
          >
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Adventure">Adventure</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Animation">Animation</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Year</label>
          <input
            type="number"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            placeholder="e.g. 2024"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
          >
            <option value="title">Title</option>
            <option value="year">Year</option>
            <option value="rating">Rating</option>
            <option value="boxoffice">Box Office</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Order</label>
          <select
            value={filters.order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400"
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
        
        <button
          onClick={onApplyFilters}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded transition-colors duration-200"
        >
          Apply Filters
        </button>
        
        <button
          onClick={() => onFiltersChange({ genre: '', year: '', sortBy: 'title', order: 'ASC' })}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors duration-200"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;