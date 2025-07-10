import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Play, Calendar, Star } from 'lucide-react';
import MovieGrid from '../components/cards/MovieGrid';

const BASE_URL = 'http://localhost:5000/api';

const Watchlist = ({ user }) => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchWatchlist();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchWatchlist = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Fetching watchlist for user:', user);

            // Make sure user has an id
            if (!user.id) {
                throw new Error('User ID is missing');
            }

            const response = await fetch(`${BASE_URL}/user/watchlist/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // Adjust based on your auth setup
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Watchlist data received:', data);

            // Handle both formats: direct array or object with data property
            const watchlistData = data.data || data;
            setWatchlist(Array.isArray(watchlistData) ? watchlistData : []);

        } catch (err) {
            console.error('Error fetching watchlist:', err);
            setError(err.message || 'Failed to load watchlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWatchlist = async (movie) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/user/removefromlist`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    movie_id: parseInt(movie.movie_id),
                    user_id: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Movie removed from watchlist successfully!');
            } else {
                alert(data.error || 'Failed to remove movie from watchlist');
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            alert('An error occurred. Please try again.');
        }
        fetchWatchlist();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="text-gray-400">Please sign in to view your watchlist.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading your watchlist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Bookmark size={32} className="text-yellow-400" />
                    <h1 className="text-3xl font-bold">My Watchlist</h1>
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                        {watchlist.length} movies
                    </span>
                </div>

                {error && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                        <p className="font-medium">Error loading watchlist:</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={fetchWatchlist}
                            className="mt-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-sm transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!error && watchlist.length === 0 ? (
                    <div className="text-center py-16">
                        <Bookmark size={64} className="text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
                        <p className="text-gray-400 mb-6">
                            Start adding movies you want to watch later!
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Browse Movies
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {watchlist.map((movie, idx) => (
                            <div key={movie.id} className="flex items-start gap-4">
                                {/* Index number */}
                                <div className="flex-shrink-0 w-8 text-center">
                                    <span className="text-2xl font-bold text-yellow-400">
                                        {idx + 1}
                                    </span>
                                </div>

                                {/* Movie Grid Component */}
                                <div className="flex-1">
                                    <MovieGrid movie={movie} index={idx + 1} />
                                </div>

                                {/* Remove button */}
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => removeFromWatchlist(movie)}
                                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                                        title="Remove from watchlist"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;