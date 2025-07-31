import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api';
import ReviewCard from '../components/cards/ReviewCard';
import { Star, X, ArrowLeft, Film, Users, Clock, Award, Plus, MessageCircle } from 'lucide-react';

export default function Reviews({ user }) {
  const { movie_id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  // Rating modal states  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Fetch movie details  
  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await axios.get(`${BASE_URL}/movies/${movie_id}`);
        console.log("🎬 Movie data:", res.data.data);
        setMovie(res.data.data);
      } catch (err) {
        setError('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    }
    fetchMovie();
  }, [movie_id]);

  // Fetch all reviews  
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await axios.get(`${BASE_URL}/reviews/${movie_id}`);
        console.log("📝 Reviews data:", res.data);
        setReviews(res.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    }
    if (movie_id) {
      fetchReviews();
    }
  }, [movie_id]);

  // Check if user has already reviewed this movie  
  useEffect(() => {
    async function checkUserReview() {
      if (!user || !movie_id) return;

      try {
        const response = await fetch(`${BASE_URL}/reviews/isreview?movieId=${movie_id}&userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setHasUserReviewed(data.is_reviewed);
        }
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    }

    checkUserReview();
  }, [user, movie_id]);

  // Handle rating modal open  
  const handleOpenRatingModal = () => {
    if (!user) {
      alert('Please sign in to review this movie');
      return;
    }

    if (hasUserReviewed) {
      alert('You have already reviewed this movie');
      return;
    }

    setShowRatingModal(true);
  };

  // Handle rating modal close  
  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setUserRating(0);
    setReviewText('');
  };

  // Handle rating submission  
  const handleSubmitRating = async () => {
    if (userRating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/reviews/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: parseInt(movie_id),
          userId: user.id,
          rating: userRating,
          comment: reviewText.trim() || null
        })
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setHasUserReviewed(true);
        handleCloseRatingModal();

        // Refresh reviews  
        const res = await axios.get(`${BASE_URL}/reviews/${movie_id}`);
        setReviews(res.data);

        // Refresh movie data to get updated average rating  
        const movieRes = await axios.get(`${BASE_URL}/movies/${movie_id}`);
        setMovie(movieRes.data.data);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleReviewUpdate = (updatedReview) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.review_id === updatedReview.review_id
          ? { ...review, ...updatedReview }
          : review
      )
    );

    // Refresh movie data to get updated average rating  
    const fetchUpdatedMovie = async () => {
      try {
        const movieRes = await axios.get(`${BASE_URL}/movies/${movie_id}`);
        setMovie(movieRes.data.data);
      } catch (error) {
        console.error('Error fetching updated movie data:', error);
      }
    };
    fetchUpdatedMovie();
  };

  // Handler for when a review is deleted  
  const handleReviewDelete = (reviewId) => {
    setReviews(prevReviews =>
      prevReviews.filter(review => review.review_id !== reviewId)
    );

    // Check if the deleted review belongs to the current user  
    const deletedReview = reviews.find(review => review.review_id === reviewId);
    if (deletedReview && user && deletedReview.user_id === user.id) {
      setHasUserReviewed(false);
    }

    // Refresh movie data to get updated average rating  
    const fetchUpdatedMovie = async () => {
      try {
        const movieRes = await axios.get(`${BASE_URL}/movies/${movie_id}`);
        setMovie(movieRes.data.data);
      } catch (error) {
        console.error('Error fetching updated movie data:', error);
      }
    };
    fetchUpdatedMovie();
  };

  // Star rating component  
  const StarRating = ({ rating, onRatingChange, interactive = true }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            className={`transition-all duration-200 transform ${interactive ? 'hover:scale-110' : ''
              } ${star <= (hoverRating || rating)
                ? 'text-yellow-400 drop-shadow-lg'
                : 'text-gray-500 hover:text-gray-400'
              }`}
            onClick={() => interactive && onRatingChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <Star
              size={24}
              fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
              className="drop-shadow-sm"
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mb-4"></div>
            <Film className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} />
          </div>
          <p className="text-white font-medium">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <X className="text-red-400" size={32} />
          </div>
          <p className="text-red-400 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Film className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-white text-lg">Movie not found</p>
        </div>
      </div>
    );
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back to Movie Link */}
          <Link
            to={`/movie/${movie_id}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all duration-200 hover:gap-3 mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back to Movie</span>
          </Link>

          {/* Movie Info Header */}
          <div className="relative bg-gradient-to-r from-gray-800/80 via-gray-800/60 to-transparent rounded-2xl overflow-hidden backdrop-blur-sm border border-gray-700/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>

            <div className="relative flex items-start gap-6 p-8">
              <div className="flex-shrink-0">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-32 h-48 rounded-xl shadow-2xl object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                    {movie.title} <span className="text-2xl text-gray-400 font-normal">({year})</span>
                  </h1>
                  <p className="text-gray-300 text-lg leading-relaxed">{movie.about}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700/30 rounded-xl p-3 backdrop-blur-sm border border-gray-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="text-yellow-400" size={16} />
                      <span className="text-gray-400 text-xs font-medium">RATING</span>
                    </div>
                    <div className="text-xl font-bold text-white">{parseFloat(movie.avg_rating).toFixed(1)}/10</div>
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-3 backdrop-blur-sm border border-gray-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="text-green-400" size={16} />
                      <span className="text-gray-400 text-xs font-medium">REVIEWS</span>
                    </div>
                    <div className="text-xl font-bold text-white">{movie.review_count}</div>
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-3 backdrop-blur-sm border border-gray-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="text-blue-400" size={16} />
                      <span className="text-gray-400 text-xs font-medium">RUNTIME</span>
                    </div>
                    <div className="text-xl font-bold text-white">{movie.runtime} min</div>
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-3 backdrop-blur-sm border border-gray-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="text-purple-400" size={16} />
                      <span className="text-gray-400 text-xs font-medium">RATED</span>
                    </div>
                    <div className="text-xl font-bold text-white">{movie.mpaa_rating}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          {/* Header with Add Review Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageCircle className="text-blue-400" size={28} />
              All Reviews ({reviews.length})
            </h2>
            {user && (
              <button
                onClick={handleOpenRatingModal}
                disabled={hasUserReviewed}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${hasUserReviewed
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                {hasUserReviewed ? (
                  <>
                    <Star size={18} className="fill-current" />
                    Already Reviewed
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Your Review
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-gray-800/30 rounded-2xl backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-xl">
            {reviewsLoading ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mb-4"></div>
                  <MessageCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={20} />
                </div>
                <p className="text-gray-300 font-medium">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {reviews.map((review, index) => (
                  <div
                    key={review.review_id}
                    className={`p-8 transition-colors duration-200 hover:bg-gray-700/20 ${index === 0 ? 'rounded-t-2xl' : ''
                      } ${index === reviews.length - 1 ? 'rounded-b-2xl' : ''}`}
                  >
                    <ReviewCard
                      review={review}
                      user={user}
                      onReviewUpdate={handleReviewUpdate}
                      onReviewDelete={handleReviewDelete}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Reviews Yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {user ?
                    'Be the first to review this movie!' :
                    'Sign in to write the first review!'
                  }
                </p>
                {user && (
                  <button
                    onClick={handleOpenRatingModal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Write First Review
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sign in prompt for non-authenticated users */}
          {!user && reviews.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Join the Conversation</h3>
              <p className="text-gray-300">
                <strong>Sign in</strong> to add your own review for this movie.
              </p>
            </div>
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-700/50 transform transition-all duration-300">
              <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Review "{movie.title}"</h3>
                </div>
                <button
                  onClick={handleCloseRatingModal}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-white mb-3 font-semibold">
                    Your Rating: <span className="text-red-400">*</span>
                  </label>
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                    <div className="flex justify-center mb-4">
                      <StarRating
                        rating={userRating}
                        onRatingChange={setUserRating}
                        interactive={true}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {userRating > 0 ? `${userRating}/10` : 'Select Rating'}
                      </div>
                      <p className="text-sm text-gray-400">Click on a star to rate (1-10)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-3 font-semibold">Write a Review (Optional):</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about this movie..."
                    className="w-full p-4 bg-gray-700/50 text-white rounded-xl border border-gray-600/50 focus:border-blue-400 focus:outline-none resize-none transition-colors backdrop-blur-sm"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCloseRatingModal}
                    className="flex-1 px-6 py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-gray-600/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating || userRating === 0}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform ${isSubmittingRating || userRating === 0
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/50'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      }`}
                  >
                    {isSubmittingRating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}  