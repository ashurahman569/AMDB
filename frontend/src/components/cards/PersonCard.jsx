import React from 'react';
import { Users } from 'lucide-react';

const PersonCard = ({ person, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(person.person_id);
    }
  };

  return (
    <div 
      className="w-60 h-90 bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:scale-105 border border-gray-600 flex-shrink-0"
      onClick={handleClick}
    >
      <div className="h-3/4 bg-gray-700 flex items-center justify-center text-gray-400">
        {person.photo_url ? (
          <img 
            src={person.photo_url} 
            alt={`${person.first_name} ${person.last_name}`} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <Users size={32} />
        )}
      </div>
      <div className="p-2 h-1/4 flex items-center">
        <p className="text-white text-m truncate w-full text-center">
          {person.first_name} {person.last_name}
        </p>
      </div>
    </div>
  );
};

export default PersonCard;