import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users as UsersIcon,
    ArrowLeft,
    Shield,
    Ban,
    UserCheck,
    Calendar,
    Mail,
    User,
    AlertTriangle,
    RefreshCw,
    Search,
    Filter,
    X,
    ChevronUp,
    ChevronDown,
    Activity,
    Star,
    MessageSquare,
    Clock
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

const Users = ({ user }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [banReason, setBanReason] = useState('');
    const [userToBan, setUserToBan] = useState(null);
    const [showBanModal, setShowBanModal] = useState(false);

    // Activity modal states
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);
    const [selectedUserActivity, setSelectedUserActivity] = useState(null);
    const [userActivities, setUserActivities] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        if (user.user_type !== 'admin' && user.user_type !== 'moderator') {
            navigate('/');
            return;
        }

        fetchUsers();
        fetchBannedUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = user?.token || localStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/admin/users`, {
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
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchBannedUsers = async () => {
        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/banned-users`, {
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
            setBannedUsers(data);
        } catch (err) {
            console.error('Error fetching banned users:', err);
        }
    };

    const fetchUserActivity = async (userId, userInfo) => {
        try {
            setActivityLoading(true);
            const token = user?.token || localStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/admin/user-activity/${userId}`, {
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
            setSelectedUserActivity(data.user);
            setUserActivities(data.activities);
            setShowActivityModal(true);
        } catch (err) {
            console.error('Error fetching user activity:', err);
            alert('Failed to load user activity');
        } finally {
            setActivityLoading(false);
        }
    };

    const handlePromoteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to promote ${username} to moderator?`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/promote-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                alert('User promoted to moderator successfully!');
                await fetchUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to promote user');
            }
        } catch (err) {
            console.error('Error promoting user:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleDemoteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to demote ${username} to regular user?`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/demote-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                alert('Moderator demoted to regular user successfully!');
                await fetchUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to demote user');
            }
        } catch (err) {
            console.error('Error demoting user:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleBanUser = async (userId) => {
        if (!banReason.trim()) {
            alert('Please provide a ban reason');
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/ban-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    ban_reason: banReason
                })
            });

            if (response.ok) {
                alert('User banned successfully!');
                closeBanModal();
                await fetchUsers();
                await fetchBannedUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to ban user');
            }
        } catch (err) {
            console.error('Error banning user:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Are you sure you want to unban this user?')) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/unban-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                alert('User unbanned successfully!');
                await fetchUsers();
                await fetchBannedUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to unban user');
            }
        } catch (err) {
            console.error('Error unbanning user:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const openBanModal = (userData) => {
        setUserToBan(userData);
        setShowBanModal(true);
        setBanReason('');
    };

    const closeBanModal = () => {
        setShowBanModal(false);
        setBanReason('');
        setUserToBan(null);
    };

    const closeActivityModal = () => {
        setShowActivityModal(false);
        setSelectedUserActivity(null);
        setUserActivities([]);
    };

    const filteredUsers = users.filter(userData => {
        const matchesSearch = userData.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || userData.user_type === filterType;
        return matchesSearch && matchesFilter;
    });

    const filteredBannedUsers = bannedUsers.filter(userData => {
        return userData.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserTypeColor = (userType) => {
        switch (userType) {
            case 'admin': return 'text-red-400 bg-red-900';
            case 'moderator': return 'text-yellow-400 bg-yellow-900';
            default: return 'text-green-400 bg-green-900';
        }
    };

    const renderActivityItem = (activity) => {
        if (activity.activity_type === 'review') {
            return (
                <div key={`review-${activity.review_id}`} className="border-l-4 border-blue-500 pl-4 py-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <Star size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">Reviewed "{activity.movie_title}"</span>
                                <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                                    {activity.rating}/10
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <Clock size={14} />
                                <span>{formatDateTime(activity.created_at)}</span>
                            </div>
                            {activity.review_text && (
                                <div className="bg-gray-700 rounded p-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare size={14} className="text-gray-400" />
                                        <span className="text-gray-400">Review:</span>
                                    </div>
                                    <p className="line-clamp-3">{activity.review_text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        } else if (activity.activity_type === 'ban') {
            return (
                <div key={`ban-${activity.banned_id}`} className="border-l-4 border-red-500 pl-4 py-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <Ban size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">Banned user "{activity.banned_username}"</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <Clock size={14} />
                                <span>{formatDateTime(activity.ban_date)}</span>
                            </div>
                            {activity.ban_reason && (
                                <div className="bg-red-900 rounded p-3 text-sm text-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={14} className="text-red-400" />
                                        <span className="text-red-400">Ban Reason:</span>
                                    </div>
                                    <p>{activity.ban_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    };

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'moderator')) {
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
                            <button
                                onClick={() => navigate('/569adminpanel325')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to Admin</span>
                            </button>
                            <div className="flex items-center gap-3">
                                <UsersIcon size={32} className="text-white" />
                                <h1 className="text-3xl font-bold">User Management</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                fetchUsers();
                                fetchBannedUsers();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                        <p className="font-medium">Error:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'active'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <UserCheck size={20} />
                            <span>Active Users ({users.length})</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('banned')}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'banned'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Ban size={20} />
                            <span>Banned Users ({bannedUsers.length})</span>
                        </div>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {activeTab === 'active' && (
                        <div className="relative">
                            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">All Users</option>
                                <option value="admin">Admins</option>
                                <option value="moderator">Moderators</option>
                                <option value="regular">Regular Users</option>
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading users...</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        {activeTab === 'active' ? (
                            // Active Users Table with improved column widths  
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px]">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[20%]">User</th>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[25%]">Email</th>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[12%]">Type</th>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[13%]">Join Date</th>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[10%]">Status</th>
                                            <th className="px-4 py-4 text-left text-lg font-large text-gray-300 w-[20%]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {filteredUsers.map((userData) => (
                                            <tr key={userData.user_id} className="hover:bg-gray-700">
                                                <td className="px-4 py-4 w-[20%]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <User size={20} className="text-white" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-white truncate">{userData.username}</div>
                                                            <div className="text-sm text-gray-400">ID: {userData.user_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[25%]">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-300 truncate">{userData.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[12%]">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getUserTypeColor(userData.user_type)}`}>
                                                        {userData.user_type.charAt(0).toUpperCase() + userData.user_type.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 w-[13%]">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-300 whitespace-nowrap">{formatDate(userData.join_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[10%]">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${userData.is_active ? 'text-green-400 bg-green-900' : 'text-red-400 bg-red-900'
                                                        }`}>
                                                        {userData.is_active ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 w-[20%]">
                                                    <div className="flex items-center gap-1">
                                                        {/* View Activity Button */}
                                                        <button
                                                            onClick={() => fetchUserActivity(userData.user_id, userData)}
                                                            disabled={activityLoading}
                                                            className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white text-xs rounded transition-colors whitespace-nowrap"
                                                            title="View Activity"
                                                        >
                                                            <Activity size={12} />
                                                            <span>Activity</span>
                                                        </button>

                                                        {/* Admin-only promote/demote actions */}
                                                        {user.user_type === 'admin' && (
                                                            <>
                                                                {userData.user_type === 'regular' && (
                                                                    <button
                                                                        onClick={() => handlePromoteUser(userData.user_id, userData.username)}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                                                                        title="Promote to Moderator"
                                                                    >
                                                                        <ChevronUp size={12} />
                                                                        <span>Promote</span>
                                                                    </button>
                                                                )}
                                                                {userData.user_type === 'moderator' && (
                                                                    <button
                                                                        onClick={() => handleDemoteUser(userData.user_id, userData.username)}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                                                                        title="Demote to Regular"
                                                                    >
                                                                        <ChevronDown size={12} />
                                                                        <span>Demote</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Ban action for non-admin/moderator users */}
                                                        {userData.user_type !== 'admin' && userData.user_type !== 'moderator' && (
                                                            <button
                                                                onClick={() => openBanModal(userData)}
                                                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors whitespace-nowrap"
                                                            >
                                                                <Ban size={12} />
                                                                <span>Ban</span>
                                                            </button>
                                                        )}

                                                        {/* Protected status for admin/moderator */}
                                                        {(userData.user_type === 'admin' || (userData.user_type === 'moderator' && user.user_type !== 'admin')) && (
                                                            <span className="text-gray-500 text-xs whitespace-nowrap">Protected</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-12">
                                        <UsersIcon size={48} className="text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No users found matching your criteria</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Banned Users Table with improved column widths  
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[20%]">User</th>
                                            <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[25%]">Email</th>
                                            <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[15%]">Ban Date</th>
                                            <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[20%]">Ban Reason</th>
                                            <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[10%]">Banned By</th>
                                            {user.user_type === 'admin' && (
                                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[10%]">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {filteredBannedUsers.map((userData) => (
                                            <tr key={userData.banned_id} className="hover:bg-gray-700">
                                                <td className="px-4 py-4 w-[20%]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Ban size={20} className="text-white" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-white truncate">{userData.username}</div>
                                                            <div className="text-sm text-gray-400">ID: {userData.user_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[25%]">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-300 truncate">{userData.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[15%]">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-300 whitespace-nowrap">{formatDateTime(userData.ban_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[20%]">
                                                    <div className="max-w-xs">
                                                        <p className="text-gray-300 text-sm truncate" title={userData.ban_reason}>
                                                            {userData.ban_reason || 'No reason provided'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 w-[10%]">
                                                    <span className="text-gray-300 text-sm whitespace-nowrap">
                                                        {userData.banner_name || 'Unknown'}
                                                    </span>
                                                </td>
                                                {user.user_type === 'admin' && (
                                                    <td className="px-4 py-4 w-[10%]">
                                                        <button
                                                            onClick={() => handleUnbanUser(userData.user_id)}
                                                            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                                                        >
                                                            <UserCheck size={16} />
                                                            <span>Unban</span>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredBannedUsers.length === 0 && (
                                    <div className="text-center py-12">
                                        <Ban size={48} className="text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No banned users found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Active Users</p>
                                <p className="text-3xl font-bold text-green-400">{users.length}</p>
                            </div>
                            <UserCheck size={24} className="text-green-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Banned Users</p>
                                <p className="text-3xl font-bold text-red-400">{bannedUsers.length}</p>
                            </div>
                            <Ban size={24} className="text-red-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Admin/Moderators</p>
                                <p className="text-3xl font-bold text-yellow-400">
                                    {users.filter(u => u.user_type === 'admin' || u.user_type === 'moderator').length}
                                </p>
                            </div>
                            <Shield size={24} className="text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Activity size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">User Activity</h3>
                                    {selectedUserActivity && (
                                        <p className="text-sm text-gray-400">
                                            {selectedUserActivity.username} ({selectedUserActivity.user_type})
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={closeActivityModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar scrollbar-thick scrollbar-track-gray-700 scrollbar-thumb-purple-500 hover:scrollbar-thumb-purple-400 scrollbar-track-rounded-full scrollbar-thumb-rounded-full">
                            {activityLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading user activity...</p>
                                </div>
                            ) : userActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <Activity size={48} className="text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">No activity found for this user</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-white mb-2">
                                            Activity Timeline ({userActivities.length} items)
                                        </h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span>Reviews ({userActivities.filter(a => a.activity_type === 'review').length})</span>
                                            </div>
                                            {selectedUserActivity?.user_type !== 'regular' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                    <span>Ban Actions ({userActivities.filter(a => a.activity_type === 'ban').length})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {userActivities.map((activity, index) => (
                                            <div key={index}>
                                                {renderActivityItem(activity)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-700">
                            <button
                                onClick={closeActivityModal}
                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ban User Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Ban User</h3>
                            <button
                                onClick={closeBanModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {userToBan && (
                            <div className="mb-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{userToBan.username}</div>
                                        <div className="text-sm text-gray-400">{userToBan.email}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ban Reason *
                            </label>
                            <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter the reason for banning this user..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleBanUser(userToBan.user_id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                <Ban size={20} />
                                <span>Ban User</span>
                            </button>
                            <button
                                onClick={closeBanModal}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-400 font-medium text-sm">Warning</p>
                                    <p className="text-red-200 text-xs mt-1">
                                        This action will permanently ban the user and move their data to the banned users table.
                                        This action can only be undone by an administrator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;  