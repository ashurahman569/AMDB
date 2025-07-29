import React, { useState, useEffect, useRef } from 'react';
import { Star, MoreHorizontal, Edit2, Trash2, UserX, X } from 'lucide-react';

const ReviewCard = ({ review, user, onReviewUpdate, onReviewDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const dropdownRef = useRef(null);

  // Edit review states
  const [editRating, setEditRating] = useState(review.rating || 0);
  const [editText, setEditText] = useState(review.review_text || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete/Ban states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (!review) return null;

  // Check if user can see options
  const isReviewAuthor = user && user.id === review.user_id;

  // Updated moderation logic based on requirements:
  const isHeadAdmin = user && user.user_type === 'headadmin';
  const isAdmin = user && user.user_type === 'admin';
  const isModerator = user && user.user_type === 'moderator';

  let canModerate = false;
  let canBan = false;

  if (!isReviewAuthor) { // Only apply moderation if it's not the user's own review
    if (isHeadAdmin) {
      // HeadAdmin can moderate everyone (admin, moderator, regular)
      canModerate = true;
      canBan = review.user_type !== 'admin'; // HeadAdmin can ban moderators and regular users, but not admins
    } else if (isAdmin) {
      // Admin can moderate moderators and regular users (but not other admins or headadmins)
      canModerate = review.user_type === 'moderator' || review.user_type === 'regular';
      canBan = review.user_type === 'moderator' || review.user_type === 'regular';
    } else if (isModerator) {
      // Moderator can moderate regular users only
      canModerate = review.user_type === 'regular';
      canBan = review.user_type === 'regular';
    }
  }

  const showOptions = isReviewAuthor || canModerate;

  // Format the timestamp to a readable date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    });
  };

  // Generate star rating display
  const renderStars = (rating) => {
    const starRating = rating;
    const fullStars = Math.floor(starRating);
    const emptyStars = 10 - fullStars;

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
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

  // Star rating component for editing
  const StarRating = ({ rating, onRatingChange }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-xl transition-colors ${star <= (hoverRating || rating)
              ? 'text-yellow-400'
              : 'text-gray-400'
              } hover:text-yellow-400`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star size={20} fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  // Handle edit review
  const handleEditReview = async () => {
    if (editRating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reviews/${review.review_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: editRating,
          review_text: editText.trim() || null
        })
      });

      if (response.ok) {
        const updatedReview = await response.json();
        alert('Review updated successfully!');
        setShowEditModal(false);
        if (onReviewUpdate) {
          onReviewUpdate(updatedReview);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reviews/${review.review_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Review deleted successfully!');
        setShowDeleteModal(false);
        if (onReviewDelete) {
          onReviewDelete(review.review_id);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle ban user
  const handleBanUser = async () => {
    if (!banReason.trim()) {
      alert('Please provide a reason for the ban');
      return;
    }
    console.log('Banning user with data:', {
      user_id: review.user_id,
      ban_reason: banReason.trim(),
      user: user // Check if user object is properly structured
    });
    setIsBanning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/ban-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: review.user_id,
          ban_reason: banReason.trim(),
          banner_id: user.id
        })
      });

      if (response.ok) {
        alert('User banned successfully!');
        setShowBanModal(false);
        setBanReason('');
        // Optionally refresh the page or remove the review
        if (onReviewDelete) {
          onReviewDelete(review.review_id);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsBanning(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-3 py-4 border-b border-gray-700 last:border-b-0">
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
            {showOptions && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="text-gray-400 hover:text-gray-300 p-1 transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {/* Edit option - only for review author */}
                    {isReviewAuthor && (
                      <button
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2 text-sm"
                        onClick={() => {
                          setShowEditModal(true);
                          setShowDropdown(false);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    )}

                    {/* Delete option - for review author or moderators */}
                    {(isReviewAuthor || canModerate) && (
                      <button
                        className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2 text-sm"
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowDropdown(false);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}

                    {/* Ban option - only for moderators with ban permissions */}
                    {canBan && (
                      <button
                        className="w-full px-3 py-2 text-left text-orange-400 hover:bg-gray-700 flex items-center gap-2 text-sm border-t border-gray-600"
                        onClick={() => {
                          setShowBanModal(true);
                          setShowDropdown(false);
                        }}
                      >
                        <UserX className="w-3 h-3" />
                        Ban User
                      </button>
                    )}
                  </div>
                )}
              </div>
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

      {/* Edit Modal - Fixed positioning */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Edit Review</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Your Rating:</label>
                <StarRating
                  rating={editRating}
                  onRatingChange={setEditRating}
                />
                <p className="text-sm text-gray-400 mt-1">Click on a star to rate (1-10)</p>
              </div>

              <div>
                <label className="block text-white mb-2">Review Text:</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditReview}
                  disabled={isUpdating || editRating === 0}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isUpdating || editRating === 0
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    }`}
                >
                  {isUpdating ? 'Updating...' : 'Update Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Fixed positioning */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Delete Review</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-white mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isDeleting
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal - Fixed positioning */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Ban User</h3>
              <button
                onClick={() => setShowBanModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-white mb-4">
              Are you sure you want to ban <strong>{review.user_name}</strong>? This will permanently ban the user from the platform.
            </p>

            <div className="mb-6">
              <label className="block text-white mb-2">Ban Reason:</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Please provide a reason for the ban..."
                className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-400 focus:outline-none resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={isBanning || !banReason.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isBanning || !banReason.trim()
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
              >
                {isBanning ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewCard;