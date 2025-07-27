import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Users, Plus, Shield, ArrowLeft, Award } from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

const AdminPanel = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        active_users: '--',
        banned_users: '--',
        total_movies: '--',
        total_reviews: '--',
        total_people: '--',
        average_rating: '--'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        if (user.user_type !== 'admin') {
            navigate('/');
            return;
        }
        fetchStats();
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setStats({
                active_users: data.active_users || '--',
                banned_users: data.banned_users || '--',
                total_movies: data.total_movies || '--',
                total_awards: data.total_awards || '--',
                total_reviews: data.total_reviews || '--',
                total_people: data.total_people || '--',
            });

        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDatabase = () => {
        // Navigate to database view page  
        console.log('Navigate to database view');
        navigate('/569adminpanel325/database');
    };

    const handleSeeUsers = () => {
        // Navigate to users management page  
        console.log('Navigate to users management');
        navigate('/569adminpanel325/users');
    };

    const handleAddNewRecord = () => {
        // Navigate to add new record page  
        console.log('Navigate to add new record');
        // navigate('/569adminpanel325/add-record');  
    };

    const handleGoBack = () => {
        navigate('/');
    };

    // Show loading while redirect is happening  
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        );
    }

    // Show loading while redirect is happening for non-admin users  
    if (user.user_type !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-red-700 border-b border-red-600">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <Shield size={32} className="text-white" />
                                <h1 className="text-3xl font-bold">Admin Panel</h1>
                            </div>
                            <div className="text-red-100">
                                Welcome, {user.username}
                            </div>
                        </div>
                        <button
                            onClick={handleGoBack}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Site</span>
                        </button>
                    </div>
                    <p className="text-red-100 mt-2">
                        Manage your AMDB database and user accounts
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {error && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                        <p className="font-medium">Error loading admin data:</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={fetchStats}
                            className="mt-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-sm transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* View Database Option */}
                    <div className="group">
                        <button
                            onClick={handleViewDatabase}
                            className="w-full h-64 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <div className="w-20 h-20 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center mb-6 transition-colors">
                                    <Database size={40} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                                    View Database
                                </h2>
                                <p className="text-gray-300 text-center leading-relaxed">
                                    Browse all tables, view records, and analyze your movie database structure
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* See Users Option */}
                    <div className="group">
                        <button
                            onClick={handleSeeUsers}
                            className="w-full h-64 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-500 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <div className="w-20 h-20 bg-green-600 group-hover:bg-green-500 rounded-full flex items-center justify-center mb-6 transition-colors">
                                    <Users size={40} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                                    See Users
                                </h2>
                                <p className="text-gray-300 text-center leading-relaxed">
                                    Manage user accounts, view user activity, and handle user permissions
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Add New Record Option */}
                    <div className="group md:col-span-2 lg:col-span-1">
                        <button
                            onClick={handleAddNewRecord}
                            className="w-full h-64 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-purple-500 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <div className="w-20 h-20 bg-purple-600 group-hover:bg-purple-500 rounded-full flex items-center justify-center mb-6 transition-colors">
                                    <Plus size={40} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                                    Add New Record
                                </h2>
                                <p className="text-gray-300 text-center leading-relaxed">
                                    Add new movies, actors, directors, and other database entries
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mt-16">
                    <h3 className="text-2xl font-bold mb-8 text-center">Quick Stats</h3>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading statistics...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Active Users</p>
                                        <p className="text-3xl font-bold text-green-400">{stats.active_users}</p>
                                    </div>
                                    <Users size={24} className="text-green-400" />
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Banned Users</p>
                                        <p className="text-3xl font-bold text-red-400">{stats.banned_users}</p>
                                    </div>
                                    <Shield size={24} className="text-red-400" />
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Movies</p>
                                        <p className="text-3xl font-bold text-blue-400">{stats.total_movies}</p>
                                    </div>
                                    <Database size={24} className="text-blue-400" />
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Awards</p>
                                        <p className="text-3xl font-bold text-amber-400">{stats.total_awards}</p>
                                    </div>
                                    <Award size={24} className="text-amber-400" />
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Reviews</p>
                                        <p className="text-3xl font-bold text-purple-400">{stats.total_reviews}</p>
                                    </div>
                                    <Plus size={24} className="text-purple-400" />
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total People</p>
                                        <p className="text-3xl font-bold text-yellow-400">{stats.total_people}</p>
                                    </div>
                                    <Users size={24} className="text-yellow-400" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Warning Notice */}
                <div className="mt-12 bg-red-900 border border-red-700 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <Shield size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-red-400 font-bold mb-2">Administrative Access</h4>
                            <p className="text-red-200 text-sm leading-relaxed">
                                You have administrative privileges. Please use these tools responsibly.
                                Any changes made here will affect the entire database and all users.
                                Always backup data before making significant modifications.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;  