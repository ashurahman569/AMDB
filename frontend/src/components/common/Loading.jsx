import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <div className="text-gray-400">{message}</div>
      </div>
    </div>
  );
};

export default Loading;