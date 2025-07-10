import React from 'react';
import { Star, MoreHorizontal } from 'lucide-react';

const ReviewCard = ({ review, user}) => {
  if (!review) return null;

  // Format the timestamp to a readable date (like "10/1/19")
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    });
  };

  // Generate star rating display (convert 0-10 to 0-10 stars)
  const renderStars = (rating) => {
    const starRating = rating; // Convert 10-point to 10-star scale
    const fullStars = Math.floor(starRating);
    const emptyStars = 10 - fullStars;
    
    return (
      <div className="flex items-center gap-1">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 text-gray-300" />
        ))}
      </div>
    );
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-b-0">
      {/* User Avatar */}
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-medium">
          {getUserInitials(review.user_name)}
        </span>
      </div>

      {/* Review Content */}
      <div className="flex-1 min-w-0">
        {/* Header with name and more options */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-m font-bold text-white">
            {review.user_name}
          </span>
          {user && user.id == review.user_id && (
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stars and Date */}
        <div className="flex items-center gap-2 mb-2">
          {review.rating && renderStars(review.rating)}
          <span className="text-xs text-gray-500">
            {formatDate(review.created_at)}
          </span>
        </div>

        {/* Review Text */}
        {review.review_text && (
          <p className="text-m text-white leading-relaxed">
            {review.review_text}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;