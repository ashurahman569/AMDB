import React, { useState, useEffect } from 'react';
import { User, LogOut, LogIn, UserPlus, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

// Custom Notification Component
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-6 right-6 ${bgColor} text-white p-4 rounded-lg shadow-2xl flex items-center gap-3 z-[60] min-w-80 animate-in slide-in-from-right-full duration-300`}>
      <Icon size={20} />
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const Profile = ({ user, onLogin, onRegister, onLogout }) => {
    const [showModal, setShowModal] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });

    const showNotification = (type, message) => {
        setNotification({ type, message });
    };

    const hideNotification = () => {
        setNotification(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            if (isLoginMode) {
                await onLogin(formData.email, formData.password);
                showNotification('success', 'Welcome back! Login successful.');
            } else {
                await onRegister(formData.username, formData.email, formData.password);
                showNotification('success', 'Account created! You can now sign in.');
            }
            setShowModal(false);
            setFormData({ email: '', password: '', username: '' });
            setShowPassword(false);
        } catch (error) {
            console.error('Auth error:', error);
            showNotification('error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        onLogout();
        setShowModal(false);
        showNotification('success', 'Successfully signed out. See you soon!');
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setFormData({ email: '', password: '', username: '' });
        setShowPassword(false);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsLoginMode(true);
        setFormData({ email: '', password: '', username: '' });
        setShowPassword(false);
        setIsLoading(false);
    };

    return (
        <div>
            {/* Notification */}
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={hideNotification}
                />
            )}

            {/* Profile Button */}
            <div className="flex items-center">
                <button
                    onClick={() => setShowModal(true)}
                    className="group flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-gray-800/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-yellow-400/25 transition-shadow duration-200">
                            <User size={18} className="text-gray-900" />
                        </div>
                        {user && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                        )}
                    </div>
                    <span className="text-white font-medium group-hover:text-yellow-400 transition-colors duration-200">
                        {user ? user.username : 'Account'}
                    </span>
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-2xl border border-gray-700/50 animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            disabled={isLoading}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg p-1.5 transition-all duration-200"
                        >
                            <X size={20} />
                        </button>

                        {user ? (
                            /* Logged In User */
                            <div className="text-center">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                        <User size={36} className="text-gray-900" />
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Welcome back!
                                </h2>
                                <p className="text-lg font-semibold text-yellow-400 mb-1">{user.username}</p>
                                <p className="text-gray-400 mb-8 text-sm">{user.email}</p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            /* Login/Register Form */
                            <div>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                                        {isLoginMode ? <LogIn size={28} className="text-gray-900" /> : <UserPlus size={28} className="text-gray-900" />}
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {isLoginMode ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className="text-gray-400">
                                        {isLoginMode ? 'Sign in to your account' : 'Join us today'}
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    {!isLoginMode && (
                                        <div className="space-y-2">
                                            <label className="block text-gray-300 text-sm font-semibold">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                className="w-full px-4 py-3 bg-gray-800/50 text-white border border-gray-600/50 rounded-xl focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 disabled:opacity-50"
                                                placeholder="Choose a username"
                                                required={!isLoginMode}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-gray-300 text-sm font-semibold">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-gray-800/50 text-white border border-gray-600/50 rounded-xl focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 disabled:opacity-50"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-gray-300 text-sm font-semibold">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                className="w-full px-4 py-3 pr-12 bg-gray-800/50 text-white border border-gray-600/50 rounded-xl focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 disabled:opacity-50"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                disabled={isLoading}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 py-3.5 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-yellow-400/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {isLoginMode ? (
                                                    <>
                                                        <LogIn size={18} />
                                                        Sign In
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={18} />
                                                        Create Account
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-8 text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400">or</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleMode}
                                        disabled={isLoading}
                                        className="mt-4 text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {isLoginMode
                                            ? "Don't have an account? Register here"
                                            : "Already have an account? Sign in here"
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;