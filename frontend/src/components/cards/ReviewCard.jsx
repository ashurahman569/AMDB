import React, { useState, useEffect, useRef } from 'react';
import { Star, MoreHorizontal, Edit2, Trash2, UserX, X, AlertTriangle, CheckCircle } from 'lucide-react';

const ReviewCard = ({ review, user, onReviewUpdate, onReviewDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [notification, setNotification] = useState(null);
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

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!review) return null;

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Check if user can see options
  const isReviewAuthor = user && user.id === review.user_id;
  const isHeadAdmin = user && user.user_type === 'headadmin';
  const isAdmin = user && user.user_type === 'admin';
  const isModerator = user && user.user_type === 'moderator';

  let canModerate = false;
  let canBan = false;

  if (!isReviewAuthor) {
    if (isHeadAdmin) {
      canModerate = true;
      canBan = review.user_type !== 'admin';
    } else if (isAdmin) {
      canModerate = review.user_type === 'moderator' || review.user_type === 'regular';
      canBan = review.user_type === 'moderator' || review.user_type === 'regular';
    } else if (isModerator) {
      canModerate = review.user_type === 'regular';
      canBan = review.user_type === 'regular';
    }
  }

  const showOptions = isReviewAuthor || canModerate;

  // Format the timestamp to a readable date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Generate star rating display with animation
  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    const [hoverRating, setHoverRating] = useState(0);
    const starRating = Math.min(Math.max(rating, 0), 10);

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
          const isActive = star <= (interactive ? (hoverRating || starRating) : starRating);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              className={`transition-all duration-200 ${
                interactive 
                  ? 'hover:scale-110 cursor-pointer' 
                  : 'cursor-default'
              } ${isActive ? 'text-amber-400' : 'text-slate-600'}`}
              onClick={() => interactive && onRatingChange && onRatingChange(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              <Star 
                size={interactive ? 18 : 14} 
                fill={isActive ? 'currentColor' : 'none'}
                className="drop-shadow-sm"
              />
            </button>
          );
        })}
        {!interactive && (
          <span className="ml-2 text-xs font-medium text-slate-400">
            {starRating}/10
          </span>
        )}
      </div>
    );
  };

  // Get user initials for avatar with better color generation
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-teal-500 to-green-500'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Handle edit review with better error handling
  const handleEditReview = async () => {
    if (editRating === 0) {
      showNotification('Please select a rating', 'error');
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
        showNotification('Review updated successfully!');
        setShowEditModal(false);
        if (onReviewUpdate) {
          onReviewUpdate(updatedReview);
        }
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Failed to update review', 'error');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      showNotification('Network error. Please try again.', 'error');
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
        showNotification('Review deleted successfully!');
        setShowDeleteModal(false);
        if (onReviewDelete) {
          onReviewDelete(review.review_id);
        }
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Failed to delete review', 'error');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle ban user
  const handleBanUser = async () => {
    if (!banReason.trim()) {
      showNotification('Please provide a reason for the ban', 'error');
      return;
    }

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
        showNotification('User banned successfully!');
        setShowBanModal(false);
        setBanReason('');
        if (onReviewDelete) {
          onReviewDelete(review.review_id);
        }
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Failed to ban user', 'error');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsBanning(false);
    }
  };

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${
          notification.type === 'error' 
            ? 'bg-red-900/90 border-red-700 text-red-100' 
            : 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="group relative bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:border-slate-600/50 hover:-translate-y-0.5">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-start gap-4">
          {/* Enhanced User Avatar */}
          <div className={`w-12 h-12 ${getAvatarColor(review.user_name)} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/10 transition-transform duration-300 group-hover:scale-105`}>
            <span className="text-white text-sm font-bold tracking-wide">
              {getUserInitials(review.user_name)}
            </span>
          </div>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            {/* Header with enhanced styling */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">
                  {review.user_name}
                </span>
                {(isHeadAdmin || isAdmin || isModerator) && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    review.user_type === 'headadmin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    review.user_type === 'admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    review.user_type === 'moderator' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {review.user_type}
                  </span>
                )}
              </div>
              
              {showOptions && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="text-slate-400 hover:text-white p-2 rounded-lg transition-all duration-200 hover:bg-slate-700/50"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-12 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl z-20 min-w-[140px] animate-in slide-in-from-top-2 duration-200">
                      {isReviewAuthor && (
                        <button
                          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 flex items-center gap-3 text-sm transition-colors rounded-t-xl"
                          onClick={() => {
                            setShowEditModal(true);
                            setShowDropdown(false);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                          Edit
                        </button>
                      )}

                      {(isReviewAuthor || canModerate) && (
                        <button
                          className="w-full px-4 py-3 text-left text-red-300 hover:bg-slate-700/50 flex items-center gap-3 text-sm transition-colors border-t border-slate-600/30"
                          onClick={() => {
                            setShowDeleteModal(true);
                            setShowDropdown(false);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}

                      {canBan && (
                        <button
                          className="w-full px-4 py-3 text-left text-orange-300 hover:bg-slate-700/50 flex items-center gap-3 text-sm border-t border-slate-600/30 transition-colors rounded-b-xl"
                          onClick={() => {
                            setShowBanModal(true);
                            setShowDropdown(false);
                          }}
                        >
                          <UserX className="w-4 h-4" />
                          Ban User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stars and Date with enhanced styling */}
            <div className="flex items-center gap-4 mb-4">
              {review.rating && renderStars(review.rating)}
              <span className="text-sm text-slate-400 font-medium">
                {formatDate(review.created_at)}
              </span>
            </div>

            {/* Review Text with enhanced typography */}
            {review.review_text && (
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-200 leading-relaxed text-base">
                  {review.review_text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Edit Review</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-3">Your Rating</label>
                {renderStars(editRating, true, setEditRating)}
                <p className="text-sm text-slate-400 mt-2">Click on a star to rate (1-10)</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-3">Review Text</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="w-full p-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none transition-all duration-200"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-200 font-medium border border-slate-600/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditReview}
                  disabled={isUpdating || editRating === 0}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isUpdating || editRating === 0
                      ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    'Update Review'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Delete Review</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-slate-200 leading-relaxed">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-200 font-medium border border-slate-600/30"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={isDeleting}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isDeleting
                    ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
                    : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Ban User</h3>
              <button
                onClick={() => setShowBanModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <UserX className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-slate-200">
                Are you sure you want to ban <strong className="text-white">{review.user_name}</strong>? This will permanently ban the user from the platform.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-white font-medium mb-3">Ban Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Please provide a detailed reason for the ban..."
                className="w-full p-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 resize-none transition-all duration-200"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-200 font-medium border border-slate-600/30"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={isBanning || !banReason.trim()}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isBanning || !banReason.trim()
                    ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isBanning ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Banning...
                  </div>
                ) : (
                  'Ban User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewCard;