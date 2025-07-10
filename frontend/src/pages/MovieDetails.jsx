import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api';
import PersonCard from '../components/cards/PersonCard';
import { Users, Star, Plus, Heart, X } from 'lucide-react';
import ReviewCard from '../components/cards/ReviewCard';

export default function MovieDetailsPage({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isAddingToFav, setIsAddingToFav] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [isRemovingFromWatchlist, setIsRemovingFromWatchlist] = useState(false);
  const [isRemovingFromFav, setIsRemovingFromFav] = useState(false);
  
  // Rating modal states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

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
        setReviews(res.data); // Changed from res.data.data to res.data
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]); // Set empty array on error
      } finally {
        setReviewsLoading(false);
      }
    }
    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Handle rating modal open
  const handleOpenRatingModal = () => {
    if (!user) {
      alert('Please sign in to rate this movie');
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
          movieId: parseInt(id),
          userId: user.id,
          rating: userRating,
          comment: reviewText.trim() || null
        })
      });

      if (response.ok) {
        alert('Rating submitted successfully!');
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
        alert(errorData.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
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
            className={`text-2xl transition-colors ${
              star <= (hoverRating || rating) 
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

  // Helper function to format names from arrays
  const formatPersonNames = (personArray) => {
    if (!personArray || personArray.length === 0) return 'N/A';
    return personArray.map(person => `${person.first_name} ${person.last_name}`).join(', ');
  };
  
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  
  // Function to add movie to watchlist
  const handleAddToWatchlist = async () => {
    if (!user) {
      alert('Please sign in to add movies to your watchlist');
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
        alert('Movie added to watchlist successfully!');
        setIsInWatchlist(true);
      } else {
        // Handle specific error messages
        if (response.status === 409) {
          alert('This movie is already in your watchlist');
          setIsInWatchlist(true);
        } else if (response.status === 400) {
          alert(data.error || 'Invalid request');
        } else {
          alert(data.error || 'Failed to add movie to watchlist');
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('An error occurred. Please try again.');
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
        alert('Movie removed from watchlist successfully!');
        setIsInWatchlist(false);
      } else {
        alert(data.error || 'Failed to remove movie from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsRemovingFromWatchlist(false);
    }
  };

  // Function to add movie to favorites
  const handleAddToFavorites = async () => {
    if (!user) {
      alert('Please sign in to add movies to your favorites');
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
        alert('Movie added to favorites successfully!');
        setIsInFavorites(true);
      } else {
        // Handle specific error messages
        if (response.status === 409) {
          alert('This movie is already in your favorites');
          setIsInFavorites(true);
        } else if (response.status === 400) {
          alert(data.error || 'Invalid request');
        } else {
          alert(data.error || 'Failed to add movie to favorites');
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('An error occurred. Please try again.');
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
        alert('Movie removed from favorites successfully!');
        setIsInFavorites(false);
      } else {
        alert(data.error || 'Failed to remove movie from favorites');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsRemovingFromFav(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <img src={movie.poster_url} alt={movie.title} className="rounded-xl shadow-lg w-full" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-5xl font-bold text-white">{movie.title} ({year})</h1>
          <h2 className="text-2xl text-white">{movie.about}</h2>
          <br />
          <br />
          <p className="text-white"><strong>Release Date:</strong> {movie.release_date}</p>
          <p className="text-white"><strong>MPAA Rating:</strong> {movie.mpaa_rating}</p>
          <p className="text-white"><strong>Runtime:</strong> {movie.runtime} minutes</p>
          <p className="text-white"><strong>Genres:</strong> {movie.genres}</p>
          {/* Fixed: Convert directors array to string */}
          <p className="text-white"><strong>Directed by:</strong> {formatPersonNames(movie.directors)}</p>
          {/* Fixed: Convert writers array to string */}
          <p className="text-white"><strong>Written by:</strong> {formatPersonNames(movie.writers)}</p>
          <p className="text-white"><strong>Box Office:</strong> ${movie.box_office?.toLocaleString()}</p>
          <p className="text-white"><strong>Average Rating:</strong> {parseFloat(movie.avg_rating).toFixed(1)} / 10 ({movie.review_count} reviews)</p>
          
          {/* User-specific actions */}
          {user && (
            <div className="flex gap-4 mt-6">
              <button 
                onClick={handleOpenRatingModal}
                disabled={hasUserReviewed}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  hasUserReviewed 
                    ? 'bg-green-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                }`}
              >
                <Star size={18} />
                {hasUserReviewed ? 'Already Rated' : 'Rate Movie'}
              </button>
              
              {/* Watchlist Button */}
              {isInWatchlist ? (
                <button 
                  onClick={handleRemoveFromWatchlist}
                  disabled={isRemovingFromWatchlist}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isRemovingFromWatchlist 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Plus size={18} className="rotate-45" />
                  {isRemovingFromWatchlist ? 'Removing...' : 'Remove from Watchlist'}
                </button>
              ) : (
                <button 
                  onClick={handleAddToWatchlist}
                  disabled={isAddingToWatchlist}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isAddingToWatchlist 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Plus size={18} />
                  {isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
                </button>
              )}
              
              {/* Favorites Button */}
              {isInFavorites ? (
                <button 
                  onClick={handleRemoveFromFavorites}
                  disabled={isRemovingFromFav}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isRemovingFromFav 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <Heart size={18} fill="currentColor" />
                  {isRemovingFromFav ? 'Removing...' : 'Remove from Favorites'}
                </button>
              ) : (
                <button 
                  onClick={handleAddToFavorites}
                  disabled={isAddingToFav}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isAddingToFav 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-pink-600 hover:bg-pink-700 text-white'
                  }`}
                >
                  <Heart size={18} />
                  {isAddingToFav ? 'Adding...' : 'Add to Favorites'}
                </button>
              )}
            </div>
          )}
          
          {!user && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-gray-300">
                <strong>Sign in</strong> to rate this movie, add it to your watchlist, or mark as favorite.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Rate "{movie.title}"</h3>
              <button
                onClick={handleCloseRatingModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Your Rating:</label>
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
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none resize-none"
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
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isSubmittingRating || userRating === 0
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                  }`}
                >
                  {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold text-white">Plot</h2>
        <p className="text-white">{movie.plot}</p>

        {movie.trailer_url && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-white"><br></br>Trailer</h2>
            <iframe
              className="w-full aspect-video rounded-xl mt-2"
              src={`${movie.trailer_url.replace('watch?v=', 'embed/')}?quality=hd1080&vq=hd1080&hd=1&autoplay=0&rel=0&modestbranding=1`}
              title="Trailer"
              width="1280"
              height="720"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Directors Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2 text-white"><br></br>Director:</h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2">
            {movie.directors && movie.directors.length > 0 ? (
              movie.directors.map(person => (
                <PersonCard key={person.person_id} person={person} />
              ))
            ) : (
              <p className="text-gray-300">No director information available</p>
            )}
          </div>
        </div>

        {/* Writers Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2 text-white">Scriptwriter:</h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2">
            {movie.writers && movie.writers.length > 0 ? (
              movie.writers.map(person => (
                <PersonCard key={person.person_id} person={person} />
              ))
            ) : (
              <p className="text-gray-300">No scriptwriter information available</p>
            )}
          </div>
        </div>

        {/* Cast Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2 text-white">Top Cast:</h2>
          <div className="relative group">
            <div className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide pb-2" id="cast-scroll">
              {movie.cast && movie.cast.length > 0 ? (
                movie.cast.map(person => (
                  <div key={person.person_id} className="flex flex-col items-center flex-shrink-0">
                    <PersonCard person={person} />
                    {person.character_name && (
                      <p className="text-m text-yellow-200 mt-1">{person.character_name}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-300">No cast information available</p>
              )}
            </div>

            {/* Navigation Arrows */}
            {movie.cast && movie.cast.length > 5 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => {
                    const container = document.getElementById('cast-scroll');
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }}
                >
                  ←
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => {
                    const container = document.getElementById('cast-scroll');
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Reviews</h2>
          {user && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Write Review
            </button>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          {reviewsLoading ? (
            <div className="text-center text-gray-400 py-8">Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <>
              {reviews.slice(0, 3).map(review => (
                <div key={review.review_id} className="mb-4">
                  <ReviewCard review={review} user={user} />
                  {/* Show edit/delete options if this is the user's review */}
                  {/* {user && review.user_id === user.user_id && (
                    <div className="flex gap-2 mt-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      <button className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                  )} */}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No reviews yet. {user ? 'Be the first to review this movie!' : 'Sign in to write the first review!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}