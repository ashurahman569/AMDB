import React from 'react';
import { useNavigate } from 'react-router-dom';

const GenreDropdown = () => {
  const navigate = useNavigate();

  const handleGenre = (genre) => {
    navigate(`/search?genre=${genre}`);
  };

  return (
    <div className="genre-dropdown">
      <button>Genres</button>
      <div className="dropdown-content">
        <button onClick={() => handleGenre('Action')}>Action</button>
        <button onClick={() => handleGenre('Comedy')}>Comedy</button>
        <button onClick={() => handleGenre('Drama')}>Drama</button>
      </div>
    </div>
  );
};

export default GenreDropdown;