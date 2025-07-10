import React from 'react';
import { useNavigate } from 'react-router-dom';

const SortDropdown = () => {
  const navigate = useNavigate();

  const handleSort = (sortBy) => {
    navigate(`/search?sortBy=${sortBy}`);
  };

  return (
    <select onChange={(e) => handleSort(e.target.value)}>
      <option value="">Sort By</option>
      <option value="popularity">Popularity</option>
      <option value="box_office">Box Office</option>
      <option value="year">Year</option>
    </select>
  );
};

export default SortDropdown;