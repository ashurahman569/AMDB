import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bookmark, Heart, X, Shield } from 'lucide-react';
import Profile from './Profile'; // Import the Profile component

const Header = ({ user, onLogin, onRegister, onLogout }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log(`Navigating to: /search?q=${encodeURIComponent(searchQuery.trim())}`);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    const handleWatchlistClick = () => {
        if (user) {
            navigate('/watchlist');
        } else {
            setModalMessage('You need to be signed in to see your watchlist!');
            setShowLoginModal(true);
        }
    };

    const handleFavouritesClick = () => {
        if (user) {
            navigate('/favourites');
        } else {
            setModalMessage('You need to be signed in to see your favourites!');
            setShowLoginModal(true);
        }
    };

    const handleAdminPanelClick = () => {
        navigate('/569adminpanel325');
    };

    const closeModal = () => {
        setShowLoginModal(false);
        setModalMessage('');
    };

    // Check if user is admin
    const isAdminorMod = user && (user.user_type === 'admin' || user.user_type === 'moderator' || user.user_type === 'headadmin');
        // Debug logging

    
    return (
        <>
            <header className="bg-gray-900 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button
                        onClick={handleLogoClick}
                        className="text-yellow-400 text-2xl font-bold border-2 border-yellow-400 px-3 py-1 hover:bg-yellow-400 hover:text-gray-900 transition-colors"
                    >
                        AMDB
                    </button>

                    <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search movies by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-300"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    {/* Watchlist Button */}
                    <button
                        onClick={handleWatchlistClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-white"
                    >
                        <Bookmark size={18} />
                        <span>Watchlist</span>
                    </button>

                    {/* Favourites Button */}
                    <button
                        onClick={handleFavouritesClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-white"
                    >
                        <Heart size={18} />
                        <span>Favourites</span>
                    </button>

                    {/* Profile Component */}
                    <Profile 
                        user={user}
                        onLogin={onLogin}
                        onRegister={onRegister}
                        onLogout={onLogout}
                    />

                    {/* Admin Panel Button - Only show for admin users */}
                    {isAdminorMod && (
                        <button
                            onClick={handleAdminPanelClick}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-800 bg-red-700 transition-colors text-white border border-red-600"
                        >
                            <Shield size={18} />
                            <span>Admin Panel</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Login Required Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 relative">
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart size={32} className="text-gray-900" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Sign In Required
                            </h2>
                            <p className="text-gray-300 mb-6">
                                {modalMessage}
                            </p>
                            <button
                                onClick={closeModal}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;