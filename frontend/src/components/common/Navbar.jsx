import React from 'react';
import SearchBar from './SearchBar';
import SortDropdown from '../SortDropdown';
import GenreDropdown from '../GenreDropdown';

const Navbar = () => {
  return (
    <div className="navbar">
      <SearchBar />
      <SortDropdown />
      <GenreDropdown />
    </div>
  );
};

export default Navbar;