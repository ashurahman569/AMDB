import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api';
import ReviewCard from '../components/cards/ReviewCard';
import { Star, X, ArrowLeft, Film } from 'lucide-react';

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
            className={`text-2xl transition-colors ${star <= (hoverRating || rating)
              ? 'text-yellow-400'
              : 'text-gray-400'
              } ${interactive ? 'hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRatingChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <Star size={24} fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-center mt-10 text-white">Loading...</div>;
  if (error) return <div className="text-center text-red-400 mt-10">{error}</div>;
  if (!movie) return <div className="text-center mt-10 text-white">Movie not found.</div>;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        {/* Back to Movie Link */}
        <Link 
          to={`/movie/${movie_id}`}
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Movie
        </Link>

        {/* Movie Info Header */}
        <div className="flex items-start gap-6 bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          <img 
            src={movie.poster_url} 
            alt={movie.title} 
            className="w-24 h-36 rounded-lg shadow-lg object-cover flex-shrink-0" 
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {movie.title} ({year})
            </h1>
            <p className="text-gray-300 mb-3">{movie.about}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Star size={16} className="text-yellow-400" />
                {parseFloat(movie.avg_rating).toFixed(1)} / 10
              </span>
              <span>({movie.review_count} reviews)</span>
              <span>•</span>
              <span>{movie.runtime} min</span>
              <span>•</span>
              <span>{movie.mpaa_rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6">
        {/* Header with Add Review Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Film size={24} className="text-blue-400" />
            All Reviews ({reviews.length})
          </h2>
          {user && (
            <button 
              onClick={handleOpenRatingModal}
              disabled={hasUserReviewed}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasUserReviewed
                  ? 'bg-green-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {hasUserReviewed ? 'Already Reviewed' : 'Add Your Review'}
            </button>
          )}
        </div>

        {/* Reviews List */}
        <div className="bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700">
          {reviewsLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              Loading reviews...
            </div>
          ) : reviews.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {reviews.map((review, index) => (
                <div key={review.review_id} className={`p-6 ${index === 0 ? 'rounded-t-xl' : ''} ${index === reviews.length - 1 ? 'rounded-b-xl' : ''}`}>
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
            <div className="text-center text-gray-400 py-12">
              <Film size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
              <p className="mb-4">
                {user ? 'Be the first to review this movie!' : 'Sign in to write the first review!'}
              </p>
              {user && (
                <button 
                  onClick={handleOpenRatingModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Write First Review
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!user && reviews.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700 text-center">
            <p className="text-gray-300">
              <strong>Sign in</strong> to add your own review for this movie.
            </p>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Review "{movie.title}"</h3>
              <button
                onClick={handleCloseRatingModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Your Rating: <span className="text-red-400">*</span></label>
                <StarRating
                  rating={userRating}
                  onRatingChange={setUserRating}
                  interactive={true}
                />
                <p className="text-sm text-gray-400 mt-1">Click on a star to rate (1-10)</p>
              </div>

              <div>
                <label className="block text-white mb-2">Write a Review (Optional):</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseRatingModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating || userRating === 0}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isSubmittingRating || userRating === 0
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {isSubmittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}