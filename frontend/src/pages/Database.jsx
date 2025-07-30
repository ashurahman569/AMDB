import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database as DatabaseIcon, ArrowLeft, Film, Users, User, Camera, PenTool, Award, Search, Eye, X, Calendar, Star, MapPin, Image, RefreshCw, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

const Database = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('movies');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 200;

    // Data states  
    const [movies, setMovies] = useState([]);
    const [people, setPeople] = useState([]);
    const [actors, setActors] = useState([]);
    const [directors, setDirectors] = useState([]);
    const [writers, setWriters] = useState([]);
    const [awards, setAwards] = useState([]);

    // Modal states  
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [currentMovieId, setCurrentMovieId] = useState(null);
    const [currentActorId, setCurrentActorId] = useState(null);
    const [currentDirectorId, setCurrentDirectorId] = useState(null);
    const [currentAwardId, setCurrentAwardId] = useState(null);

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [editingPerson, setEditingPerson] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        if (user.user_type == 'moderator' || user.user_type == 'regular') {
            navigate('/');
            return;
        }

        // Fetch all data on component mount
        fetchAllData();
    }, [user, navigate]);

    // Separate effect for tab changes (if you want to refresh data when switching tabs)
    useEffect(() => {
        if (user && (user.user_type === 'admin' || user.user_type === 'headadmin')) {
            // You can choose to refetch data for the active tab here if needed
            // fetchData();
        }
    }, [activeTab]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = user?.token || localStorage.getItem('token');

            const endpoints = [
                { endpoint: '/admin/movies', setter: setMovies },
                { endpoint: '/admin/people', setter: setPeople },
                { endpoint: '/admin/actors', setter: setActors },
                { endpoint: '/admin/directors', setter: setDirectors },
                { endpoint: '/admin/writers', setter: setWriters },
                { endpoint: '/admin/awards', setter: setAwards }
            ];

            // Fetch all data in parallel
            const promises = endpoints.map(async ({ endpoint, setter }) => {
                try {
                    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
                    setter(data);
                } catch (err) {
                    console.error(`Error fetching ${endpoint}:`, err);
                    setter([]); // Set empty array on error
                }
            });

            await Promise.all(promises);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchModalData = async (endpoint, title, movieId = null, actorId = null, directorId = null, awardId = null) => {
        try {
            setModalLoading(true);
            setModalTitle(title);
            setShowModal(true);
            setCurrentMovieId(movieId);
            setCurrentActorId(actorId);
            setCurrentDirectorId(directorId);
            setCurrentAwardId(awardId);

            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
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
            setModalData(data);
        } catch (err) {
            console.error('Error fetching modal data:', err);
            setModalData([]);
        } finally {
            setModalLoading(false);
        }
    };


    const deleteFromMovie = async (endpoint, itemName) => {
        if (!window.confirm(`Are you sure you want to remove this ${itemName}?`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh modal data
            const currentEndpoint = modalTitle.includes('Genres') ? `/movie-genres/${currentMovieId}` :
                modalTitle.includes('Roles') ? `/movie-roles/${currentMovieId}` :
                    modalTitle.includes('Directors') ? `/movie-directors/${currentMovieId}` :
                        modalTitle.includes('Writers') ? `/movie-writers/${currentMovieId}` :
                            `/movie-awards/${currentMovieId}`;

            fetchModalData(currentEndpoint, modalTitle, currentMovieId);
        } catch (err) {
            console.error(`Error deleting ${itemName}:`, err);
            alert(`Failed to delete ${itemName}`);
        }
    };

    const deleteFromActor = async (endpoint, itemName) => {
        if (!window.confirm(`Are you sure you want to remove this ${itemName}?`)) {
            return;
        }
        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh modal data using the current actor ID
            const currentEndpoint = `/actor-awards/${currentActorId}`;
            fetchModalData(currentEndpoint, modalTitle, null, currentActorId);
        } catch (err) {
            console.error(`Error deleting ${itemName}:`, err);
            alert(`Failed to delete ${itemName}`);
        }
    };

    const deleteFromDirector = async (endpoint, itemName) => {
        if (!window.confirm(`Are you sure you want to remove this ${itemName}?`)) {
            return;
        }
        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh modal data using the current director ID
            const currentEndpoint = `/director-awards/${currentDirectorId}`;
            fetchModalData(currentEndpoint, modalTitle, null, null, currentDirectorId);
        } catch (err) {
            console.error(`Error deleting ${itemName}:`, err);
            alert(`Failed to delete ${itemName}`);
        }
    };

    const deleteAwardWinner = async (endpoint, itemName) => {
        if (!window.confirm(`Are you sure you want to remove this ${itemName}?`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh modal data for award winners
            if (modalTitle.includes('Winners of') && currentAwardId) {
                fetchModalData(
                    `/award-winners/${currentAwardId}`,
                    modalTitle,
                    null, // movieId
                    null, // actorId
                    null, // directorId
                    currentAwardId // awardId
                );
            }
        } catch (err) {
            console.error(`Error deleting ${itemName}:`, err);
            alert(`Failed to delete ${itemName}`);
        }
    };

    // Updated openEditModal function to handle both movies and people
    const openEditModal = (item) => {
        // Check if it's a movie or person by checking for movie_id vs person_id
        if (item.movie_id) {
            // It's a movie
            setEditingMovie(item);
            setEditingPerson(null);
            setEditFormData({
                title: item.title || '',
                release_date: item.release_date ? item.release_date.split('T')[0] : '',
                runtime: item.runtime || '',
                plot: item.plot || '',
                mpaa_rating: item.mpaa_rating || '',
                budget: item.budget || '',
                box_office: item.box_office || '',
                poster_url: item.poster_url || ''
            });
        } else if (item.person_id) {
            // It's a person
            setEditingPerson(item);
            setEditingMovie(null);
            setEditFormData({
                first_name: item.first_name || '',
                last_name: item.last_name || '',
                birth_date: item.birth_date ? item.birth_date.split('T')[0] : '',
                death_date: item.death_date ? item.death_date.split('T')[0] : '',
                birthplace: item.birthplace || '',
                biography: item.biography || '',
                photo_url: item.photo_url || ''
            });
        }
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingMovie(null);
        setEditingPerson(null);
        setEditFormData({});
    };

    const isFormChanged = () => {
        if (editingMovie) {
            // Movie form change detection
            const fieldsToCheck = [
                "title", "release_date", "runtime", "plot",
                "mpaa_rating", "budget", "box_office", "poster_url"
            ];

            for (const field of fieldsToCheck) {
                const original = editingMovie[field] || '';
                const edited = editFormData[field] || '';
                // Handle date format if needed
                if (field === "release_date" && original) {
                    if (original.split('T')[0] !== edited) return true;
                } else if (original.toString() !== edited.toString()) {
                    return true;
                }
            }
            return false;
        } else if (editingPerson) {
            // Person form change detection
            const fieldsToCheck = [
                "first_name", "last_name", "birth_date", "death_date",
                "birthplace", "biography", "photo_url"
            ];

            for (const field of fieldsToCheck) {
                const original = editingPerson[field] || '';
                const edited = editFormData[field] || '';
                // Handle date format if needed
                if ((field === "birth_date" || field === "death_date") && original) {
                    if (original.split('T')[0] !== edited) return true;
                } else if (original.toString() !== edited.toString()) {
                    return true;
                }
            }
            return false;
        }
        return false;
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!isFormChanged()) {
            console.log("No changes made.");
            closeEditModal();
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');

            if (editingMovie) {
                // Handle movie edit
                const response = await fetch(`${BASE_URL}/admin/movies/${editingMovie.movie_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: editFormData.title,
                        release_date: editFormData.release_date,
                        runtime: editFormData.runtime,
                        plot: editFormData.plot,
                        about: editingMovie.about || '', // Provide fallback if about not editable
                        mpaa_rating: editFormData.mpaa_rating,
                        budget: editFormData.budget,
                        box_office: editFormData.box_office,
                        poster_url: editFormData.poster_url,
                        trailer_url: editingMovie.trailer_url || '', // Provide fallback
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                alert('Movie updated successfully!');
            } else if (editingPerson) {
                // Handle person edit
                const response = await fetch(`${BASE_URL}/admin/people/${editingPerson.person_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        first_name: editFormData.first_name,
                        last_name: editFormData.last_name,
                        birth_date: editFormData.birth_date || null,
                        death_date: editFormData.death_date || null,
                        birthplace: editFormData.birthplace,
                        biography: editFormData.biography,
                        photo_url: editFormData.photo_url
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                alert('Person updated successfully!');
            }

            closeEditModal();
            fetchAllData(); // Refresh data
        } catch (err) {
            console.error('Error updating:', err);
            alert(`Failed to update ${editingMovie ? 'movie' : 'person'}`);
        }
    };

    const deleteMovie = async () => {
        if (!window.confirm(`Are you sure you want to delete "${editingMovie.title}"? This will remove all related data and cannot be undone.`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/movies/${editingMovie.movie_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Movie deleted successfully!');
            closeEditModal();
            fetchAllData(); // Refresh data
        } catch (err) {
            console.error('Error deleting movie:', err);
            alert('Failed to delete movie');
        }
    };

    const deletePerson = async () => {
        if (!window.confirm(`Are you sure you want to delete "${editingPerson.first_name} ${editingPerson.last_name}"? This will remove all related data and cannot be undone.`)) {
            return;
        }

        try {
            const token = user?.token || localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/person/${editingPerson.person_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Person deleted successfully!');
            closeEditModal();
            fetchAllData(); // Refresh data
        } catch (err) {
            console.error('Error deleting person:', err);
            alert('Failed to delete person');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData([]);
        setModalTitle('');
        setCurrentMovieId(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getFilteredData = () => {
        let data = [];
        switch (activeTab) {
            case 'movies':
                data = movies;
                break;
            case 'people':
                data = people;
                break;
            case 'actors':
                data = actors;
                break;
            case 'directors':
                data = directors;
                break;
            case 'writers':
                data = writers;
                break;
            case 'awards':
                data = awards;
                break;
            default:
                return [];
        }

        if (!searchTerm) return data;

        return data.filter(item => {
            const searchLower = searchTerm.toLowerCase();
            switch (activeTab) {
                case 'movies':
                    return item.title?.toLowerCase().includes(searchLower);
                case 'people':
                case 'actors':
                case 'directors':
                case 'writers':
                    return (
                        item.first_name?.toLowerCase().includes(searchLower) ||
                        item.last_name?.toLowerCase().includes(searchLower) ||
                        `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchLower)
                    );
                case 'awards':
                    return item.name?.toLowerCase().includes(searchLower);
                default:
                    return false;
            }
        });
    };

    const getPaginatedData = () => {
        const filteredData = getFilteredData();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const getTotalPages = () => {
        const filteredData = getFilteredData();
        return Math.ceil(filteredData.length / itemsPerPage);
    };

    const renderPagination = () => {
        const totalPages = getTotalPages();
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 9;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-6">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="text-gray-400">...</span>}
                    </>
                )}

                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded transition-colors ${currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    const renderMoviesTab = () => {
        const paginatedMovies = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1500px] table-fixed">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[17%]">Title</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[8%]">Release Date</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[5%]">Runtime</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[42%]">Plot</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[5%]">Rating</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[6%]">Budget</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[6%]">Box Office</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[11%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedMovies.map((movie) => (
                                <tr key={movie.movie_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[17%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-24 rounded overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                                                {movie.poster_url ? (
                                                    <img
                                                        src={movie.poster_url}
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full flex items-center justify-center ${movie.poster_url ? 'hidden' : 'flex'}`}>
                                                    <Film size={32} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-white">{movie.title}</div>
                                                <div className="text-sm text-gray-400 truncate">ID: {movie.movie_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[8%]">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 whitespace-nowrap">{formatDate(movie.release_date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[5%]">
                                        <span className="text-gray-300">{movie.runtime ? `${movie.runtime} min` : 'N/A'}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[42%]">
                                        <span className="text-gray-300 line-clamp-5">{movie.plot || 'N/A'}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[5%]">
                                        <span className="text-gray-300">{movie.mpaa_rating || 'N/A'}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[6%]">
                                        <span className="text-gray-300">{formatCurrency(movie.budget)}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[6%]">
                                        <span className="text-gray-300">{formatCurrency(movie.box_office)}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[11%]">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => openEditModal(movie)}
                                                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Edit size={12} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => fetchModalData(`/movie-genres/${movie.movie_id}`, `Genres for "${movie.title}"`, movie.movie_id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Eye size={12} />
                                                <span>Genres</span>
                                            </button>
                                            <button
                                                onClick={() => fetchModalData(`/movie-roles/${movie.movie_id}`, `Roles in "${movie.title}"`, movie.movie_id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Eye size={12} />
                                                <span>Roles</span>
                                            </button>
                                            <button
                                                onClick={() => fetchModalData(`/movie-directors/${movie.movie_id}`, `Directors of "${movie.title}"`, movie.movie_id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Eye size={12} />
                                                <span>Directors</span>
                                            </button>
                                            <button
                                                onClick={() => fetchModalData(`/movie-writers/${movie.movie_id}`, `Writers of "${movie.title}"`, movie.movie_id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Eye size={12} />
                                                <span>Writers</span>
                                            </button>
                                            <button
                                                onClick={() => fetchModalData(`/movie-awards/${movie.movie_id}`, `Awards for "${movie.title}"`, movie.movie_id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Eye size={12} />
                                                <span>Awards</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedMovies.length === 0 && (
                        <div className="text-center py-12">
                            <Film size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No movies found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderPeopleTab = () => {
        const paginatedPeople = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[18%]">Name</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[9%]">Birth Date</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[9%]">Death Date</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[20%]">Birthplace</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[35%]">Biography</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[9%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedPeople.map((person) => (
                                <tr key={person.person_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[18%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-20 overflow-hidden bg-gray-600 flex-shrink-0">
                                                {person.photo_url ? (
                                                    <img
                                                        src={person.photo_url}
                                                        alt={`${person.first_name} ${person.last_name}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full bg-gray-600 flex items-center justify-center ${person.photo_url ? 'hidden' : 'flex'}`}>
                                                    <User size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {person.first_name} {person.last_name}
                                                </div>
                                                <div className="text-sm text-gray-400">ID: {person.person_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[9%]">
                                        <span className="text-gray-300">{formatDate(person.birth_date)}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[9%]">
                                        <span className="text-gray-300">{formatDate(person.death_date)}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[20%]">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 truncate">{person.birthplace || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[35%]">
                                        <span className="text-gray-300 line-clamp-4">{person.biography || 'No biography'}</span>
                                    </td>
                                    <td className="px-4 py-4 w-[9%]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(person)}
                                                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors whitespace-nowrap w-[80px] justify-center"
                                            >
                                                <Edit size={12} />
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedPeople.length === 0 && (
                        <div className="text-center py-12">
                            <Users size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No people found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderActorsTab = () => {
        const paginatedActors = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[40%]">Name</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[30%]">Birthplace</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[30%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedActors.map((actor) => (
                                <tr key={actor.actor_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[40%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                                {actor.photo_url ? (
                                                    <img
                                                        src={actor.photo_url}
                                                        alt={`${actor.first_name} ${actor.last_name}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full bg-blue-600 flex items-center justify-center ${actor.photo_url ? 'hidden' : 'flex'}`}>
                                                    <User size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {actor.first_name} {actor.last_name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    Actor ID: {actor.actor_id} | Person ID: {actor.person_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[30%]">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 truncate">{actor.birthplace || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[30%]">
                                        <button
                                            onClick={() => fetchModalData(
                                                `/actor-awards/${actor.actor_id}`,
                                                `Awards won by ${actor.first_name} ${actor.last_name}`,
                                                null, // movieId is null for actor awards
                                                actor.actor_id // Pass the actor ID
                                            )}
                                            className="flex items-center gap-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                                        >
                                            <Award size={16} />
                                            <span>View Awards</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedActors.length === 0 && (
                        <div className="text-center py-12">
                            <User size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No actors found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderDirectorsTab = () => {
        const paginatedDirectors = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[40%]">Name</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[30%]">Birthplace</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[30%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedDirectors.map((director) => (
                                <tr key={director.director_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[40%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                                {director.photo_url ? (
                                                    <img
                                                        src={director.photo_url}
                                                        alt={`${director.first_name} ${director.last_name}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full bg-purple-600 flex items-center justify-center ${director.photo_url ? 'hidden' : 'flex'}`}>
                                                    <Camera size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {director.first_name} {director.last_name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    Director ID: {director.director_id} | Person ID: {director.person_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[30%]">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 truncate">{director.birthplace || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[30%]">
                                        <button
                                            onClick={() => fetchModalData(
                                                `/director-awards/${director.director_id}`,
                                                `Awards won through director ${director.first_name} ${director.last_name}`,
                                                null, // movieId is null for director awards
                                                null, // actorId is null for director awards
                                                director.director_id // Pass the director ID
                                            )}
                                            className="flex items-center gap-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                                        >
                                            <Award size={16} />
                                            <span>View Awards</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedDirectors.length === 0 && (
                        <div className="text-center py-12">
                            <Camera size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No directors found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderWritersTab = () => {
        const paginatedWriters = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[50%]">Name</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[50%]">Birthplace</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedWriters.map((writer) => (
                                <tr key={writer.writer_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[50%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                                {writer.photo_url ? (
                                                    <img
                                                        src={writer.photo_url}
                                                        alt={`${writer.first_name} ${writer.last_name}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full bg-orange-600 flex items-center justify-center ${writer.photo_url ? 'hidden' : 'flex'}`}>
                                                    <PenTool size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">
                                                    {writer.first_name} {writer.last_name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    Writer ID: {writer.writer_id} | Person ID: {writer.person_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[50%]">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 truncate">{writer.birthplace || 'N/A'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedWriters.length === 0 && (
                        <div className="text-center py-12">
                            <PenTool size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No writers found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderAwardsTab = () => {
        const paginatedAwards = getPaginatedData();

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[30%]">Award Name</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[20%]">Year</th>
                                <th className="px-4 py-4 text-left text-sm font-medium text-gray-300 w-[50%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedAwards.map((award) => (
                                <tr key={award.award_id} className="hover:bg-gray-700">
                                    <td className="px-4 py-4 w-[30%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Award size={20} className="text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white truncate">{award.name}</div>
                                                <div className="text-sm text-gray-400">ID: {award.award_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[20%]">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300">{award.year || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 w-[50%]">
                                        <button
                                            onClick={() => {
                                                setCurrentAwardId(award.award_id); // Set this first
                                                fetchModalData(
                                                    `/award-winners/${award.award_id}`,
                                                    `Winners of ${award.name} (${award.year})`,
                                                    null, // movieId
                                                    null, // actorId  
                                                    null, // directorId
                                                    award.award_id // awardId
                                                );
                                            }}
                                            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                        >
                                            <Eye size={16} />
                                            <span>View Winners</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedAwards.length === 0 && (
                        <div className="text-center py-12">
                            <Award size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No awards found</p>
                        </div>
                    )}
                </div>
                {renderPagination()}
            </>
        );
    };

    const renderModalContent = () => {
        if (modalLoading) {
            return (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            );
        }

        if (modalData.length === 0) {
            return (
                <div className="text-center py-12">
                    <DatabaseIcon size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No data found</p>
                </div>
            );
        }

        // Handle different types of modal data  
        if (modalTitle.includes('Genres')) {
            return (
                <div className="space-y-3">
                    {modalData.map((genre, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">{genre.genre_id}</span>
                                </div>
                                <span className="text-white font-medium">{genre.name}</span>
                            </div>
                            <button
                                onClick={() => deleteFromMovie(`/movie-genre/${currentMovieId}/${genre.genre_id}`, 'genre')}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (modalTitle.includes('Roles')) {
            return (
                <div className="space-y-3">
                    {modalData.map((role, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                    {role.photo_url ? (
                                        <img
                                            src={role.photo_url}
                                            alt={`${role.first_name} ${role.last_name}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-full bg-blue-600 flex items-center justify-center ${role.photo_url ? 'hidden' : 'flex'}`}>
                                        <User size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {role.first_name} {role.last_name}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        as {role.character_name || 'Unknown Character'}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        Role ID: {role.role_id}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteFromMovie(`/movie-role/${currentMovieId}/${role.role_id}`, 'role')}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (modalTitle.includes('Directors')) {
            return (
                <div className="space-y-3">
                    {modalData.map((person, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                    {person.photo_url ? (
                                        <img
                                            src={person.photo_url}
                                            alt={`${person.first_name} ${person.last_name}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-full bg-purple-600 flex items-center justify-center ${person.photo_url ? 'hidden' : 'flex'}`}>
                                        <Camera size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {person.first_name} {person.last_name}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        Director ID: {person.director_id}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteFromMovie(`/movie-director/${currentMovieId}/${person.director_id}`, 'director')}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (modalTitle.includes('Writers')) {
            return (
                <div className="space-y-3">
                    {modalData.map((person, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                                    {person.photo_url ? (
                                        <img
                                            src={person.photo_url}
                                            alt={`${person.first_name} ${person.last_name}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-full bg-orange-600 flex items-center justify-center ${person.photo_url ? 'hidden' : 'flex'}`}>
                                        <PenTool size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {person.first_name} {person.last_name}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        Writer ID: {person.writer_id}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteFromMovie(`/movie-writer/${currentMovieId}/${person.writer_id}`, 'writer')}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (modalTitle.includes('Awards for')) {
            return (
                <div className="space-y-3">
                    {modalData && modalData.length > 0 ? (
                        modalData.map((award, index) => (
                            <div key={`${award.award_id}-${index}`} className="bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Award size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold">{award.award_name}</div>
                                        <div className="text-gray-300 text-sm mb-1">
                                            {award.year} • {award.category}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                            {award.award_type}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => {
                                        const awardType = award.award_type.split(':')[0].trim();
                                        const endpointType = awardType.toLowerCase();

                                        // Use the record_id for precise deletion  
                                        const endpoint = `/${endpointType}-award/${award.record_id}`;

                                        deleteFromMovie(endpoint, 'award');
                                    }}
                                    className="ml-4 flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Award size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No awards found</p>
                        </div>
                    )}
                </div>
            );
        }

        if (modalTitle.includes('Awards won by')) {
            return (
                <div className="space-y-3">
                    {modalData && modalData.length > 0 ? (
                        modalData.map((award, index) => (
                            <div key={`${award.award_id}-${index}`} className="bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Award size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold">{award.award_name}</div>
                                        <div className="text-gray-300 text-sm mb-1">
                                            {award.year} • {award.category}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                            {award.award_type}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => {
                                        const endpoint = `/actor-award/${award.record_id}`;
                                        deleteFromActor(endpoint, 'award');
                                    }}
                                    className="ml-4 flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Award size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No awards found</p>
                        </div>
                    )}
                </div>
            );
        }

        if (modalTitle.includes('Awards won through') && modalTitle.toLowerCase().includes('director')) {
            return (
                <div className="space-y-3">
                    {modalData && modalData.length > 0 ? (
                        modalData.map((award, index) => (
                            <div key={`${award.award_id}-${index}`} className="bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Award size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold">{award.award_name}</div>
                                        <div className="text-gray-300 text-sm mb-1">
                                            {award.year} • {award.category}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                            {award.award_type}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => {
                                        const endpoint = `/director-award/${award.record_id}`;
                                        deleteFromDirector(endpoint, 'award');
                                    }}
                                    className="ml-4 flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Award size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No awards found</p>
                        </div>
                    )}
                </div>
            );
        }


        if (modalTitle.includes('Winners of')) {
            return (
                <div className="space-y-3">
                    {modalData && modalData.length > 0 ? (
                        modalData.map((winner, index) => (
                            <div key={`${winner.record_id}-${index}`} className="bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${winner.winner_type === 'Movie' ? 'bg-blue-600' :
                                        winner.winner_type === 'Actor' ? 'bg-green-600' :
                                            'bg-purple-600'
                                        }`}>
                                        {winner.winner_type === 'Movie' ? <Film size={16} className="text-white" /> :
                                            winner.winner_type === 'Actor' ? <User size={16} className="text-white" /> :
                                                <Camera size={16} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium">
                                            {winner.winner_name}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {winner.category}
                                            {winner.person_name && winner.winner_type !== 'Movie' && (
                                                <span> for "{winner.person_name}"</span>
                                            )}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                            {winner.winner_type}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => {
                                        // Determine the correct endpoint based on winner_type
                                        const endpointType = winner.winner_type.toLowerCase();

                                        // Use the record_id for precise deletion
                                        const endpoint = `/${endpointType}-award/${winner.record_id}`;

                                        deleteAwardWinner(endpoint, 'award winner');
                                    }}
                                    className="ml-4 flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Award size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No winners found</p>
                        </div>
                    )}
                </div>
            );
        }
        // Default rendering for other types of data  
        return (
            <div className="space-y-3">
                {modalData.map((item, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <pre className="text-white text-sm whitespace-pre-wrap">
                            {JSON.stringify(item, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        );
    };

    const getTabIcon = (tabName) => {
        switch (tabName) {
            case 'movies': return <Film size={20} />;
            case 'people': return <Users size={20} />;
            case 'actors': return <User size={20} />;
            case 'directors': return <Camera size={20} />;
            case 'writers': return <PenTool size={20} />;
            case 'awards': return <Award size={20} />;
            default: return <DatabaseIcon size={20} />;
        }
    };

    const getTabColor = (tabName) => {
        switch (tabName) {
            case 'movies': return 'blue';
            case 'people': return 'gray';
            case 'actors': return 'green';
            case 'directors': return 'purple';
            case 'writers': return 'orange';
            case 'awards': return 'yellow';
            default: return 'gray';
        }
    };

    const getDataCount = (tabKey) => {
        switch (tabKey) {
            case 'movies': return movies.length;
            case 'people': return people.length;
            case 'actors': return actors.length;
            case 'directors': return directors.length;
            case 'writers': return writers.length;
            case 'awards': return awards.length;
            default: return 0;
        }
    };

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'headadmin')) {
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
                <div className="px-4 py-6">
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
                                <DatabaseIcon size={32} className="text-white" />
                                <h1 className="text-3xl font-bold">Database View</h1>
                            </div>
                        </div>
                        <button
                            onClick={fetchAllData}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 py-8">
                {error && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                        <p className="font-medium">Error:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { key: 'movies', label: 'All Movies' },
                        { key: 'people', label: 'All People' },
                        { key: 'actors', label: 'Actors' },
                        { key: 'directors', label: 'Directors' },
                        { key: 'writers', label: 'Writers' },
                        { key: 'awards', label: 'Awards' }
                    ].map((tab) => {
                        const color = getTabColor(tab.key);
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setCurrentPage(1); // Reset to first page when switching tabs
                                }}
                                className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive
                                    ? `bg-${color}-600 text-white`
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {getTabIcon(tab.key)}
                                <span>{tab.label}</span>
                                <span className="bg-black bg-opacity-30 px-2 py-1 rounded text-xs">
                                    {getDataCount(tab.key)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading {activeTab}...</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        {activeTab === 'movies' && renderMoviesTab()}
                        {activeTab === 'people' && renderPeopleTab()}
                        {activeTab === 'actors' && renderActorsTab()}
                        {activeTab === 'directors' && renderDirectorsTab()}
                        {activeTab === 'writers' && renderWritersTab()}
                        {activeTab === 'awards' && renderAwardsTab()}
                    </div>
                )}

                {/* Statistics */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">Movies</p>
                                <p className="text-xl font-bold text-blue-400">{movies.length}</p>
                            </div>
                            <Film size={20} className="text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">People</p>
                                <p className="text-xl font-bold text-gray-400">{people.length}</p>
                            </div>
                            <Users size={20} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">Actors</p>
                                <p className="text-xl font-bold text-green-400">{actors.length}</p>
                            </div>
                            <User size={20} className="text-green-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">Directors</p>
                                <p className="text-xl font-bold text-purple-400">{directors.length}</p>
                            </div>
                            <Camera size={20} className="text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">Writers</p>
                                <p className="text-xl font-bold text-orange-400">{writers.length}</p>
                            </div>
                            <PenTool size={20} className="text-orange-400" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">Awards</p>
                                <p className="text-xl font-bold text-yellow-400">{awards.length}</p>
                            </div>
                            <Award size={20} className="text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white">{modalTitle}</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {renderModalContent()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-700">
                            <button
                                onClick={closeModal}
                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Movie Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {editingMovie ? `Edit Movie: ${editingMovie.title}` : `Edit Person: ${editingPerson?.first_name} ${editingPerson?.last_name}`}
                            </h2>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            {editingMovie && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.title || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Release Date
                                            </label>
                                            <input
                                                type="date"
                                                value={editFormData.release_date || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, release_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Runtime (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                value={editFormData.runtime || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, runtime: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Plot
                                        </label>
                                        <textarea
                                            value={editFormData.plot || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, plot: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="4"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                MPAA Rating
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.mpaa_rating || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, mpaa_rating: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Budget
                                            </label>
                                            <input
                                                type="number"
                                                value={editFormData.budget || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Box Office
                                            </label>
                                            <input
                                                type="number"
                                                value={editFormData.box_office || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, box_office: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Poster URL
                                        </label>
                                        <input
                                            type="url"
                                            value={editFormData.poster_url || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, poster_url: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </>
                            )}

                            {editingPerson && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.first_name || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.last_name || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Birth Date
                                            </label>
                                            <input
                                                type="date"
                                                value={editFormData.birth_date || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Death Date
                                            </label>
                                            <input
                                                type="date"
                                                value={editFormData.death_date || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, death_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Birthplace
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.birthplace || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, birthplace: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Biography
                                        </label>
                                        <textarea
                                            value={editFormData.biography || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="4"
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Photo URL
                                        </label>
                                        <input
                                            type="url"
                                            value={editFormData.photo_url || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, photo_url: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={editingMovie ? deleteMovie : deletePerson}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                >
                                    Delete {editingMovie ? 'Movie' : 'Person'}
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                        disabled={!isFormChanged()}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Database;