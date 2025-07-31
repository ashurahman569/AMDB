import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api';
import PersonCard from '../components/cards/PersonCard';
import { Users, Star, Plus, Heart, X, Award, Play, Calendar, Clock, Film, TrendingUp, Eye, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import ReviewCard from '../components/cards/ReviewCard';

export default function MovieDetailsPage({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [awards, setAwards] = useState([]);
  const [awardsLoading, setAwardsLoading] = useState(true);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isAddingToFav, setIsAddingToFav] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [isRemovingFromWatchlist, setIsRemovingFromWatchlist] = useState(false);
  const [isRemovingFromFav, setIsRemovingFromFav] = useState(false);
  const [notification, setNotification] = useState(null);

  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await axios.get(`${BASE_URL}/movies/${id}`);
        console.log("🎬 Movie data:", res.data.data);
        setMovie(res.data.data);
      } catch (err) {
        setError('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    }
    fetchMovie();
  }, [id]);

  // Check if movie is in user's watchlist and favorites
  useEffect(() => {
    async function checkUserLists() {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');

        // Check watchlist
        const watchlistResponse = await fetch(`${BASE_URL}/user/checkinwatchlist?movie_id=${id}&user_id=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json();
          setIsInWatchlist(watchlistData.inWatchlist);
        }

        // Check favorites
        const favoritesResponse = await fetch(`${BASE_URL}/user/checkinfav?movie_id=${id}&user_id=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setIsInFavorites(favoritesData.inFavourites);
        }
      } catch (error) {
        console.error('Error checking user lists:', error);
      }
    }

    if (user && id) {
      checkUserLists();
    }
  }, [user, id]);

  // Check if user has already reviewed this movie
  useEffect(() => {
    async function checkUserReview() {
      if (!user || !id) return;

      try {
        const response = await fetch(`${BASE_URL}/reviews/isreview?movieId=${id}&userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setHasUserReviewed(data.is_reviewed);
        }
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    }

    checkUserReview();
  }, [user, id]);

  // Add this useEffect to fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await axios.get(`${BASE_URL}/reviews/${id}`);
        console.log("📝 Reviews data:", res.data);
        setReviews(res.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    }
    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Add this useEffect to fetch awards
  useEffect(() => {
    async function fetchAwards() {
      try {
        const res = await axios.get(`${BASE_URL}/awards/movie/${id}`);
        console.log("🏆 Awards data:", res.data);
        setAwards(res.data.data);
      } catch (err) {
        console.error('Failed to fetch awards:', err);
        setAwards([]);
      } finally {
        setAwardsLoading(false);
      }
    }
    if (id) {
      fetchAwards();
    }
  }, [id]);

  // Handle rating modal open - updated to handle both rate and review buttons
  const handleOpenRatingModal = () => {
    if (!user) {
      showNotification('Please sign in to rate this movie', 'error');
      return;
    }

    if (hasUserReviewed) {
      showNotification('You have already reviewed this movie', 'error');
      return;
    }

    setShowRatingModal(true);
  };

  const handleReviewUpdate = (updatedReview) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.review_id === updatedReview.review_id
          ? { ...review, ...updatedReview }
          : review
      )
    );

    // Optionally refresh movie data to get updated average rating
    const fetchUpdatedMovie = async () => {
      try {
        const movieRes = await axios.get(`${BASE_URL}/movies/${id}`);
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

    // Optionally refresh movie data to get updated average rating
    const fetchUpdatedMovie = async () => {
      try {
        const movieRes = await axios.get(`${BASE_URL}/movies/${id}`);
        setMovie(movieRes.data.data);
      } catch (error) {
        console.error('Error fetching updated movie data:', error);
      }
    };
    fetchUpdatedMovie();
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
      showNotification('Please select a rating', 'error');
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
          movieId: parseInt(id),
          userId: user.id,
          rating: userRating,
          comment: reviewText.trim() || null
        })
      });

      if (response.ok) {
        showNotification('Rating submitted successfully!');
        setHasUserReviewed(true);
        handleCloseRatingModal();

        // Refresh reviews
        const res = await axios.get(`${BASE_URL}/reviews/${id}`);
        setReviews(res.data);

        // Refresh movie data to get updated average rating
        const movieRes = await axios.get(`${BASE_URL}/movies/${id}`);
        setMovie(movieRes.data.data);
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Failed to submit rating', 'error');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Enhanced Star rating component
  const StarRating = ({ rating, onRatingChange, interactive = true, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            className={`transition-all duration-200 ${interactive
                ? 'hover:scale-110 cursor-pointer'
                : 'cursor-default'
              } ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-slate-600'}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <Star
              className={`${sizeClasses[size]} drop-shadow-sm`}
              fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-300">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-xl text-slate-300">Movie not found.</p>
        </div>
      </div>
    );
  }

  // Helper function to format names from arrays
  const formatPersonNames = (personArray) => {
    if (!personArray || personArray.length === 0) return 'N/A';
    return personArray.map(person => `${person.first_name} ${person.last_name}`).join(', ');
  };

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  // Function to add movie to watchlist
  const handleAddToWatchlist = async () => {
    if (!user) {
      showNotification('Please sign in to add movies to your watchlist', 'error');
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/user/addtowatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: parseInt(id),
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Movie added to watchlist successfully!');
        setIsInWatchlist(true);
      } else {
        if (response.status === 409) {
          showNotification('This movie is already in your watchlist', 'error');
          setIsInWatchlist(true);
        } else {
          showNotification(data.error || 'Failed to add movie to watchlist', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  // Function to remove movie from watchlist
  const handleRemoveFromWatchlist = async () => {
    if (!user) return;

    setIsRemovingFromWatchlist(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/user/removefromlist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: parseInt(id),
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Movie removed from watchlist successfully!');
        setIsInWatchlist(false);
      } else {
        showNotification(data.error || 'Failed to remove movie from watchlist', 'error');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsRemovingFromWatchlist(false);
    }
  };

  // Function to add movie to favorites
  const handleAddToFavorites = async () => {
    if (!user) {
      showNotification('Please sign in to add movies to your favorites', 'error');
      return;
    }

    setIsAddingToFav(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/user/addtofav`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: parseInt(id),
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Movie added to favorites successfully!');
        setIsInFavorites(true);
      } else {
        if (response.status === 409) {
          showNotification('This movie is already in your favorites', 'error');
          setIsInFavorites(true);
        } else {
          showNotification(data.error || 'Failed to add movie to favorites', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsAddingToFav(false);
    }
  };

  // Function to remove movie from favorites
  const handleRemoveFromFavorites = async () => {
    if (!user) return;

    setIsRemovingFromFav(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/user/removefromfav`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movie_id: parseInt(id),
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Movie removed from favorites successfully!');
        setIsInFavorites(false);
      } else {
        showNotification(data.error || 'Failed to remove movie from favorites', 'error');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsRemovingFromFav(false);
    }
  };

  const scrollContainer = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${notification.type === 'error'
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

      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${movie.poster_url})`,
            filter: 'blur(20px) brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Movie Poster */}
            <div className="lg:col-span-1">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] border border-slate-700/50"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Year */}
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-4 text-slate-300 text-lg">
                  <span className="flex items-center gap-2">
                    <Calendar size={20} />
                    {year}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={20} />
                    {movie.runtime} min
                  </span>
                  <span className="px-3 py-1 bg-slate-800/50 rounded-full text-sm border border-slate-600/50">
                    {movie.mpaa_rating}
                  </span>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xl text-slate-200 font-medium leading-relaxed">
                {movie.about}
              </p>

              {/* Rating and Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(parseFloat(movie.avg_rating))} interactive={false} size="md" />
                  </div>
                  <div className="text-white">
                    <span className="text-2xl font-bold">{parseFloat(movie.avg_rating).toFixed(1)}</span>
                    <span className="text-slate-400 ml-1">/10</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Eye size={18} />
                  <span>{movie.review_count} reviews</span>
                </div>
              </div>

              {/* Action Buttons */}
              {user && (
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleOpenRatingModal}
                    disabled={hasUserReviewed}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${hasUserReviewed
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-not-allowed border border-emerald-500/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                      }`}
                  >
                    <Star size={20} />
                    {hasUserReviewed ? 'Already Rated' : 'Rate Movie'}
                  </button>

                  {/* Watchlist Button */}
                  {isInWatchlist ? (
                    <button
                      onClick={handleRemoveFromWatchlist}
                      disabled={isRemovingFromWatchlist}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${isRemovingFromWatchlist
                          ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-500/50'
                        }`}
                    >
                      {isRemovingFromWatchlist ? (
                        <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <Plus size={20} className="rotate-45" />
                      )}
                      {isRemovingFromWatchlist ? 'Removing...' : 'Remove from Watchlist'}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToWatchlist}
                      disabled={isAddingToWatchlist}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${isAddingToWatchlist
                          ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 hover:border-blue-500/50'
                        }`}
                    >
                      {isAddingToWatchlist ? (
                        <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <Plus size={20} />
                      )}
                      {isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
                    </button>
                  )}

                  {/* Favorites Button */}
                  {isInFavorites ? (
                    <button
                      onClick={handleRemoveFromFavorites}
                      disabled={isRemovingFromFav}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${isRemovingFromFav
                          ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                          : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 hover:border-pink-500/50'
                        }`}
                    >
                      {isRemovingFromFav ? (
                        <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <Heart size={20} fill="currentColor" />
                      )}
                      {isRemovingFromFav ? 'Removing...' : 'Remove from Favorites'}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToFavorites}
                      disabled={isAddingToFav}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${isAddingToFav
                          ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                          : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 hover:border-pink-500/50'
                        }`}
                    >
                      {isAddingToFav ? (
                        <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <Heart size={20} />
                      )}
                      {isAddingToFav ? 'Adding...' : 'Add to Favorites'}
                    </button>
                  )}
                </div>
              )}

              {!user && (
                <div className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl border border-slate-600/50 backdrop-blur-sm">
                  <p className="text-slate-300 text-lg">
                    <strong className="text-white">Sign in</strong> to rate this movie, add it to your watchlist, or mark as favorite.
                  </p>
                </div>
              )}

              {/* Movie Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-400" size={18} />
                    <span className="text-slate-400">Release Date:</span>
                    <span className="text-white font-medium">{movie.release_date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Film className="text-purple-400" size={18} />
                    <span className="text-slate-400">Genres:</span>
                    <span className="text-white font-medium">{movie.genres}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="text-green-400" size={18} />
                    <span className="text-slate-400">Director:</span>
                    <span className="text-white font-medium">{formatPersonNames(movie.directors)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-amber-400" size={18} />
                    <span className="text-slate-400">Box Office:</span>
                    <span className="text-white font-medium">${movie.box_office?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="text-indigo-400" size={18} />
                    <span className="text-slate-400">Writers:</span>
                    <span className="text-white font-medium">{formatPersonNames(movie.writers)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Plot Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Film className="text-blue-400" size={28} />
            Plot
          </h2>
          <p className="text-slate-200 text-lg leading-relaxed">{movie.plot}</p>
        </section>

        {/* Trailer Section */}
        {movie.trailer_url && (
          <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Play className="text-red-400" size={28} />
              Trailer
            </h2>
            <div className="relative group">
              <iframe
                className="w-full aspect-video rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                src={`${movie.trailer_url.replace('watch?v=', 'embed/')}?quality=hd1080&vq=hd1080&hd=1&autoplay=0&rel=0&modestbranding=1`}
                title="Trailer"
                width="1280"
                height="720"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Directors Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Director</h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2">
            {movie.directors && movie.directors.length > 0 ? (
              movie.directors.map(person => (
                <div key={person.person_id} className="flex-shrink-0">
                  <PersonCard person={person} />
                </div>
              ))
            ) : (
              <p className="text-slate-400">No director information available</p>
            )}
          </div>
        </section>

        {/* Writers Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Scriptwriter</h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2">
            {movie.writers && movie.writers.length > 0 ? (
              movie.writers.map(person => (
                <div key={person.person_id} className="flex-shrink-0">
                  <PersonCard person={person} />
                </div>
              ))
            ) : (
              <p className="text-slate-400">No scriptwriter information available</p>
            )}
          </div>
        </section>

        {/* Cast Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Top Cast</h2>
          <div className="relative group">
            <div className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2" id="cast-scroll">
              {movie.cast && movie.cast.length > 0 ? (
                movie.cast.map(person => (
                  <div key={person.person_id} className="flex flex-col items-center flex-shrink-0 group">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <PersonCard person={person} />
                    </div>
                    {person.character_name && (
                      <p className="text-sky-400 mt-3 text-center text-lg max-w-[150px] truncate">
                        {person.character_name}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No cast information available</p>
              )}
            </div>

            {/* Navigation Arrows */}
            {movie.cast && movie.cast.length > 5 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm border border-slate-600/50"
                  onClick={() => scrollContainer('cast-scroll', 'left')}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 backdrop-blur-sm border border-slate-600/50"
                  onClick={() => scrollContainer('cast-scroll', 'right')}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Awards Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Award className="text-amber-400" size={28} />
            Awards & Recognition
          </h2>
          {awardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading awards...</span>
            </div>
          ) : awards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awards.map((award, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30 hover:border-amber-400/30 transition-colors">
                  <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-slate-200">{award.award}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No award information available for this movie</p>
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Star className="text-amber-400" size={28} />
              Reviews
            </h2>
            {user && (
              <button
                onClick={handleOpenRatingModal}
                disabled={hasUserReviewed}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${hasUserReviewed
                    ? 'bg-emerald-500/20 text-emerald-300 cursor-not-allowed border border-emerald-500/30'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
              >
                <Star size={16} />
                {hasUserReviewed ? 'Already Reviewed' : 'Add Your Review'}
              </button>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading reviews...</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.slice(0, 3).map(review => (
                <ReviewCard
                  key={review.review_id}
                  review={review}
                  user={user}
                  onReviewUpdate={handleReviewUpdate}
                  onReviewDelete={handleReviewDelete}
                />
              ))}
              {reviews.length > 3 && (
                <div className="text-center pt-6 border-t border-slate-600/50">
                  <a
                    href={`/reviews/${movie.movie_id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-blue-300 hover:text-blue-200 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-blue-500/30"
                  >
                    <Eye size={16} />
                    See all {reviews.length} reviews
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 text-lg mb-4">
                No reviews yet. {user ? 'Be the first to review this movie!' : 'Sign in to write the first review!'}
              </p>
              {user && !hasUserReviewed && (
                <button
                  onClick={handleOpenRatingModal}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Write the first review
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Enhanced Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Rate "{movie.title}"</h3>
              <button
                onClick={handleCloseRatingModal}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-3">Your Rating</label>
                <div className="flex justify-center">
                  <StarRating
                    rating={userRating}
                    onRatingChange={setUserRating}
                    interactive={true}
                    size="lg"
                  />
                </div>
                <p className="text-sm text-slate-400 mt-3 text-center">Click on a star to rate (1-10)</p>
                {userRating > 0 && (
                  <p className="text-center mt-2">
                    <span className="text-2xl font-bold text-amber-400">{userRating}</span>
                    <span className="text-slate-400 ml-1">/10</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-3">Write a Review (Optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="w-full p-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none transition-all duration-200"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCloseRatingModal}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-200 font-medium border border-slate-600/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating || userRating === 0}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${isSubmittingRating || userRating === 0
                      ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/30'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                >
                  {isSubmittingRating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}