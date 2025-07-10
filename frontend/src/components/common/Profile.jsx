import React, { useState } from 'react';
import { User, LogOut, LogIn, UserPlus, X } from 'lucide-react';

const Profile = ({ user, onLogin, onRegister, onLogout }) => {
    const [showModal, setShowModal] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLoginMode) {
                await onLogin(formData.email, formData.password);
                alert('Login successful!');
            } else {
                await onRegister(formData.username, formData.email, formData.password);
                alert('Registration successful! You can now log in.');
            }
            setShowModal(false);
            setFormData({ email: '', password: '', username: '' });
        } catch (error) {
            console.error('Auth error:', error);
            alert(error.message);
        }
    };

    const handleLogout = () => {
        onLogout();
        setShowModal(false);
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setFormData({ email: '', password: '', username: '' });
    };

    return (
        <>
            {/* Profile Button */}
            <div className="flex items-center">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <User size={18} className="text-gray-900" />
                    </div>
                    <span className="text-white">
                        {user ? user.username : 'Account'}
                    </span>
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => { setShowModal(false); setIsLoginMode(true);setFormData({ email: '', password: '', username: '' }); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        {user ? (
                            /* Logged In User */
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User size={32} className="text-gray-900" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">
                                    Welcome, {user.username}!
                                </h2>
                                <p className="text-gray-400 mb-6">{user.email}</p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            /* Login/Register Form */
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                    {isLoginMode ? 'Sign In' : 'Register'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!isLoginMode && (
                                        <div>
                                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                                                required={!isLoginMode}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoginMode ? (
                                            <>
                                                <LogIn size={18} />
                                                Sign In
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                Register
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={toggleMode}
                                        className="text-yellow-400 hover:text-yellow-300 text-sm"
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
        </>
    );
};

export default Profile;