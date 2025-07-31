import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Film, User, Award, Tag, Users, FileText,
    ArrowLeft, Plus, X, Search, Check
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

// Extract SearchField component outside to prevent re-creation
const SearchField = React.memo(({
    label,
    searchTerm,
    setSearchTerm,
    results,
    onSelect,
    selected,
    renderResult,
    placeholder
}) => {
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setSearchTerm(value);
    }, [setSearchTerm]);

    const handleSelectItem = useCallback((item) => {
        onSelect(item);
        setSearchTerm('');
    }, [onSelect, setSearchTerm]);

    const handleClearSelection = useCallback(() => {
        onSelect(null);
        setSearchTerm('');
    }, [onSelect, setSearchTerm]);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                    <Search size={20} />
                </div>
            </div>

            {selected && (
                <div className="mt-2 p-2 bg-green-900 border border-green-600 rounded flex items-center justify-between">
                    <span className="text-green-200">Selected: {renderResult(selected)}</span>
                    <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-green-400 hover:text-green-300"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {results.length > 0 && !selected && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 rounded">
                    {results.map((result, index) => (
                        <button
                            key={`${result.movie_id || result.person_id || result.award_id || result.genre_id || 'item'}-${index}`}
                            type="button"
                            onClick={() => handleSelectItem(result)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-600 border-b border-gray-600 last:border-b-0"
                        >
                            {renderResult(result)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

SearchField.displayName = 'SearchField';

const AddRecord = ({ user }) => {
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search states  
    const [movieSearchTerm, setMovieSearchTerm] = useState('');
    const [personSearchTerm, setPersonSearchTerm] = useState('');
    const [awardSearchTerm, setAwardSearchTerm] = useState('');
    const [genreSearchTerm, setGenreSearchTerm] = useState('');

    // All records fetched from backend
    const [allMovies, setAllMovies] = useState([]);
    const [allPeople, setAllPeople] = useState([]);
    const [allAwards, setAllAwards] = useState([]);
    const [allGenres, setAllGenres] = useState([]);

    // Selected items  
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedAward, setSelectedAward] = useState(null);
    const [selectedGenre, setSelectedGenre] = useState(null);

    // Form data for different modals  
    const [formData, setFormData] = useState({});

    // Memoized filtered results to prevent unnecessary re-computations
    const movieResults = useMemo(() => {
        if (!movieSearchTerm.trim()) return [];
        return allMovies.filter(movie =>
            movie.title?.toLowerCase().includes(movieSearchTerm.toLowerCase())
        );
    }, [movieSearchTerm, allMovies]);

    const personResults = useMemo(() => {
        if (!personSearchTerm.trim()) return [];
        return allPeople.filter(person => {
            const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim().toLowerCase();
            return fullName.includes(personSearchTerm.toLowerCase());
        });
    }, [personSearchTerm, allPeople]);

    const awardResults = useMemo(() => {
        if (!awardSearchTerm.trim()) return [];
        return allAwards.filter(award =>
            award.name?.toLowerCase().includes(awardSearchTerm.toLowerCase())
        );
    }, [awardSearchTerm, allAwards]);

    const genreResults = useMemo(() => {
        if (!genreSearchTerm.trim()) return [];
        return allGenres.filter(genre =>
            genre.name?.toLowerCase().includes(genreSearchTerm.toLowerCase())
        );
    }, [genreSearchTerm, allGenres]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        if (user.user_type !== 'admin' && user.user_type !== 'headadmin') {
            navigate('/');
            return;
        }

        // Fetch all records when component mounts
        fetchAllRecords();
    }, [user, navigate]);

    // Fetch all records from backend
    const fetchAllRecords = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Fetch all data concurrently
            const [moviesRes, peopleRes, awardsRes, genresRes] = await Promise.all([
                fetch(`${BASE_URL}/admin/movies`, { headers }),
                fetch(`${BASE_URL}/admin/people`, { headers }),
                fetch(`${BASE_URL}/admin/awards`, { headers }),
                fetch(`${BASE_URL}/admin/genres`, { headers })
            ]);

            if (moviesRes.ok) {
                const moviesData = await moviesRes.json();
                setAllMovies(moviesData);
            }

            if (peopleRes.ok) {
                const peopleData = await peopleRes.json();
                setAllPeople(peopleData);
            }

            if (awardsRes.ok) {
                const awardsData = await awardsRes.json();
                setAllAwards(awardsData);
            }

            if (genresRes.ok) {
                const genresData = await genresRes.json();
                setAllGenres(genresData);
            }
        } catch (err) {
            console.error('Error fetching records:', err);
        }
    };

    const resetModal = useCallback(() => {
        setActiveModal(null);
        setError('');
        setSuccess('');
        setFormData({});
        setSelectedMovie(null);
        setSelectedPerson(null);
        setSelectedAward(null);
        setSelectedGenre(null);
        setMovieSearchTerm('');
        setPersonSearchTerm('');
        setAwardSearchTerm('');
        setGenreSearchTerm('');
    }, []);

    // Submit functions  
    const handleSubmit = async (endpoint, data) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/admin/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess(result.message || 'Record added successfully!');
                // Refresh the data after successful addition
                setTimeout(() => {
                    fetchAllRecords();
                    resetModal();
                }, 2000);
            } else {
                setError(result.error || 'Failed to add record');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const cleanFormData = (value) => {
        if (typeof value === 'string') {
            return value.trim() === '' ? null : value.trim();
        }
        return value || null;
    };

    const addMovie = () => {
        const movieData = {
            movie_id: parseInt(formData.movie_id),
            title: cleanFormData(formData.title),
            release_date: cleanFormData(formData.release_date),
            runtime: formData.runtime ? parseInt(formData.runtime) : null,
            about: cleanFormData(formData.about),
            plot: cleanFormData(formData.plot),
            mpaa_rating: cleanFormData(formData.mpaa_rating),
            budget: formData.budget ? parseFloat(formData.budget) : null,
            box_office: formData.box_office ? parseFloat(formData.box_office) : null,
            poster_url: cleanFormData(formData.poster_url),
            trailer_url: cleanFormData(formData.trailer_url)
        };

        handleSubmit('add-movie', movieData);
    };

    const addPerson = () => {
        const personData = {
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            birth_date: formData.birth_date || null,
            death_date: formData.death_date || null,
            biography: formData.biography || null,
            birthplace: formData.birthplace || null,
            photo_url: formData.photo_url || null
        };
        handleSubmit('add-person', personData);
    };

    const addAward = () => {
        const awardData = {
            name: formData.name,
            year: formData.year ? parseInt(formData.year) : null
        };
        handleSubmit('add-award', awardData);
    };

    const addGenre = () => {
        const genreData = {
            genre_id: parseInt(formData.genre_id),
            name: formData.name
        };
        handleSubmit('add-genre', genreData);
    };

    const addRole = () => {
        if (!selectedMovie || !selectedPerson) {
            setError('Please select both a movie and a person');
            return;
        }

        const roleData = {
            movie_id: selectedMovie.movie_id,
            person_id: selectedPerson.person_id,
            character_name: formData.character_name
        };
        handleSubmit('add-role', roleData);
    };

    const addDirector = () => {
        if (!selectedMovie || !selectedPerson) {
            setError('Please select both a movie and a person');
            return;
        }

        const directorData = {
            movie_id: selectedMovie.movie_id,
            person_id: selectedPerson.person_id
        };
        handleSubmit('add-director', directorData);
    };

    const addWriter = () => {
        if (!selectedMovie || !selectedPerson) {
            setError('Please select both a movie and a person');
            return;
        }

        const writerData = {
            movie_id: selectedMovie.movie_id,
            person_id: selectedPerson.person_id
        };
        handleSubmit('add-writer', writerData);
    };

    const addMovieGenre = () => {
        if (!selectedMovie || !selectedGenre) {
            setError('Please select both a movie and a genre');
            return;
        }

        const movieGenreData = {
            movie_id: selectedMovie.movie_id,
            genre_id: selectedGenre.genre_id
        };
        handleSubmit('add-movie-genre', movieGenreData);
    };

    const addAwardMovie = () => {
        if (!selectedAward || !selectedMovie) {
            setError('Please select both an award and a movie');
            return;
        }

        const awardMovieData = {
            award_id: selectedAward.award_id,
            movie_id: selectedMovie.movie_id,
            category: formData.category
        };
        handleSubmit('add-award-movie', awardMovieData);
    };

    const addAwardActor = () => {
        if (!selectedAward || !selectedMovie || !selectedPerson) {
            setError('Please select an award, movie, and person');
            return;
        }

        const awardActorData = {
            award_id: selectedAward.award_id,
            movie_id: selectedMovie.movie_id,
            person_id: selectedPerson.person_id,
            category: formData.category
        };
        handleSubmit('add-award-actor', awardActorData);
    };

    const addAwardDirector = () => {
        if (!selectedAward || !selectedMovie || !selectedPerson) {
            setError('Please select an award, movie, and person');
            return;
        }

        const awardDirectorData = {
            award_id: selectedAward.award_id,
            movie_id: selectedMovie.movie_id,
            person_id: selectedPerson.person_id,
            category: formData.category
        };
        handleSubmit('add-award-director', awardDirectorData);
    };

    // Show loading while redirect is happening  
    if (!user || (user.user_type !== 'admin' && user.user_type !== 'headadmin')) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        );
    }

    const options = [
        { id: 'movie', title: 'Add a Movie', icon: Film, color: 'blue', action: () => setActiveModal('movie') },
        { id: 'person', title: 'Add a Person', icon: User, color: 'green', action: () => setActiveModal('person') },
        { id: 'award', title: 'Add an Award', icon: Award, color: 'yellow', action: () => setActiveModal('award') },
        { id: 'genre', title: 'Add a Genre', icon: Tag, color: 'purple', action: () => setActiveModal('genre') },
        { id: 'role', title: 'Add Role to Movie', icon: Users, color: 'red', action: () => setActiveModal('role') },
        { id: 'director', title: 'Add Director to Movie', icon: FileText, color: 'indigo', action: () => setActiveModal('director') },
        { id: 'writer', title: 'Add Writer to Movie', icon: FileText, color: 'pink', action: () => setActiveModal('writer') },
        { id: 'movieGenre', title: 'Add Genre to Movie', icon: Tag, color: 'cyan', action: () => setActiveModal('movieGenre') },
        { id: 'awardMovie', title: 'Add Award Winning Movie', icon: Award, color: 'orange', action: () => setActiveModal('awardMovie') },
        { id: 'awardActor', title: 'Add Award Winning Actor', icon: User, color: 'teal', action: () => setActiveModal('awardActor') },
        { id: 'awardDirector', title: 'Add Award Winning Director', icon: FileText, color: 'lime', action: () => setActiveModal('awardDirector') }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-red-700 border-b border-red-600">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <Plus size={32} className="text-white" />
                                <h1 className="text-3xl font-bold">Add New Records</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/569adminpanel325')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Admin Panel</span>
                        </button>
                    </div>
                    <p className="text-red-100 mt-2">
                        Add new movies, people, awards, and manage database relationships
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {options.map((option) => {
                        const IconComponent = option.icon;
                        return (
                            <button
                                key={option.id}
                                onClick={option.action}
                                className={`group w-full h-48 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-${option.color}-500 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
                            >
                                <div className="flex flex-col items-center justify-center h-full p-4">
                                    <div className={`w-16 h-16 bg-${option.color}-600 group-hover:bg-${option.color}-500 rounded-full flex items-center justify-center mb-4 transition-colors`}>
                                        <IconComponent size={32} className="text-white" />
                                    </div>
                                    <h2 className={`text-lg font-bold mb-2 group-hover:text-${option.color}-400 transition-colors text-center`}>
                                        {option.title}
                                    </h2>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {options.find(opt => opt.id === activeModal)?.title}
                                </h2>
                                <button
                                    onClick={resetModal}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-600 text-white p-4 rounded-lg mb-4 flex items-center gap-2">
                                    <Check size={20} />
                                    {success}
                                </div>
                            )}

                            {/* Movie Modal */}
                            {activeModal === 'movie' && (
                                <form onSubmit={(e) => { e.preventDefault(); addMovie(); }}>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Movie ID *</label>
                                            <input
                                                type="number"
                                                value={formData.movie_id || ''}
                                                onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                            <input
                                                type="text"
                                                value={formData.title || ''}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Release Date</label>
                                            <input
                                                type="date"
                                                value={formData.release_date || ''}
                                                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Runtime (minutes)</label>
                                            <input
                                                type="number"
                                                value={formData.runtime || ''}
                                                onChange={(e) => setFormData({ ...formData, runtime: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">About</label>
                                        <textarea
                                            value={formData.about || ''}
                                            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Plot</label>
                                        <textarea
                                            value={formData.plot || ''}
                                            onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="4"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">MPAA Rating</label>
                                            <input
                                                type="text"
                                                value={formData.mpaa_rating || ''}
                                                onChange={(e) => setFormData({ ...formData, mpaa_rating: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="PG-13, R, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.budget || ''}
                                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Box Office</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.box_office || ''}
                                                onChange={(e) => setFormData({ ...formData, box_office: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Poster URL</label>
                                            <input
                                                type="url"
                                                value={formData.poster_url || ''}
                                                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Trailer URL</label>
                                            <input
                                                type="url"
                                                value={formData.trailer_url || ''}
                                                onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Movie'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Person Modal */}
                            {activeModal === 'person' && (
                                <form onSubmit={(e) => { e.preventDefault(); addPerson(); }}>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.first_name || ''}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.last_name || ''}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Birth Date</label>
                                            <input
                                                type="date"
                                                value={formData.birth_date || ''}
                                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Death Date</label>
                                            <input
                                                type="date"
                                                value={formData.death_date || ''}
                                                onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Birthplace</label>
                                        <input
                                            type="text"
                                            value={formData.birthplace || ''}
                                            onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Biography</label>
                                        <textarea
                                            value={formData.biography || ''}
                                            onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="4"
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Photo URL</label>
                                        <input
                                            type="url"
                                            value={formData.photo_url || ''}
                                            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Person'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Award Modal */}
                            {activeModal === 'award' && (
                                <form onSubmit={(e) => { e.preventDefault(); addAward(); }}>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="mb-6 col-span-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Award Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                                placeholder="e.g., Academy Awards, Golden Globe Awards"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                            <input
                                                type="number"
                                                value={formData.year || ''}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                min="1900"
                                                max="2030"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Award'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Genre Modal */}
                            {activeModal === 'genre' && (
                                <form onSubmit={(e) => { e.preventDefault(); addGenre(); }}>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Genre ID *</label>
                                            <input
                                                type="number"
                                                value={formData.genre_id || ''}
                                                onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Genre Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                                placeholder="e.g., Action, Comedy, Drama"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Genre'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Role Modal */}
                            {activeModal === 'role' && (
                                <form onSubmit={(e) => { e.preventDefault(); addRole(); }}>
                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult={(movie) => (
                                            <div className="flex justify-between items-center">
                                                <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
                                                <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
                                            </div>
                                        )}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Person *"
                                        searchTerm={personSearchTerm}
                                        setSearchTerm={setPersonSearchTerm}
                                        results={personResults}
                                        onSelect={setSelectedPerson}
                                        selected={selectedPerson}
                                        renderResult = {(person) => (
    <div className="flex justify-between items-center">
        <span>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</span>
        <span className="text-xs text-gray-400 ml-2">Person ID: {person.person_id}</span>
    </div>
)}

                                        placeholder="Search for a person..."
                                    />

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Character Name</label>
                                        <input
                                            type="text"
                                            value={formData.character_name || ''}
                                            onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., John Doe, The Protagonist"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Role'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Director Modal */}
                            {activeModal === 'director' && (
                                <form onSubmit={(e) => { e.preventDefault(); addDirector(); }}>
                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Person *"
                                        searchTerm={personSearchTerm}
                                        setSearchTerm={setPersonSearchTerm}
                                        results={personResults}
                                        onSelect={setSelectedPerson}
                                        selected={selectedPerson}
                                        renderResult = {(person) => (
    <div className="flex justify-between items-center">
        <span>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</span>
        <span className="text-xs text-gray-400 ml-2">Person ID: {person.person_id}</span>
    </div>
)}

                                        placeholder="Search for a person..."
                                    />

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Director'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Writer Modal */}
                            {activeModal === 'writer' && (
                                <form onSubmit={(e) => { e.preventDefault(); addWriter(); }}>
                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Person *"
                                        searchTerm={personSearchTerm}
                                        setSearchTerm={setPersonSearchTerm}
                                        results={personResults}
                                        onSelect={setSelectedPerson}
                                        selected={selectedPerson}
                                        renderResult = {(person) => (
    <div className="flex justify-between items-center">
        <span>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</span>
        <span className="text-xs text-gray-400 ml-2">Person ID: {person.person_id}</span>
    </div>
)}

                                        placeholder="Search for a person..."
                                    />

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Writer'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Movie Genre Modal */}
                            {activeModal === 'movieGenre' && (
                                <form onSubmit={(e) => { e.preventDefault(); addMovieGenre(); }}>
                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Genre *"
                                        searchTerm={genreSearchTerm}
                                        setSearchTerm={setGenreSearchTerm}
                                        results={genreResults}
                                        onSelect={setSelectedGenre}
                                        selected={selectedGenre}
                                        renderResult = {(genre) => (
    <div className="flex justify-between items-center">
        <span>{genre.name}</span>
        <span className="text-xs text-gray-400 ml-2">Genre ID: {genre.genre_id}</span>
    </div>
)}
                                        placeholder="Search for a genre..."
                                    />

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Genre to Movie'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Award Movie Modal */}
                            {activeModal === 'awardMovie' && (
                                <form onSubmit={(e) => { e.preventDefault(); addAwardMovie(); }}>
                                    <SearchField
                                        label="Select Award *"
                                        searchTerm={awardSearchTerm}
                                        setSearchTerm={setAwardSearchTerm}
                                        results={awardResults}
                                        onSelect={setSelectedAward}
                                        selected={selectedAward}
                                        renderResult = {(award) => (
    <div className="flex justify-between items-center">
        <span>{award.name} {award.year ? `(${award.year})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Award ID: {award.award_id}</span>
    </div>
)}
                                        placeholder="Search for an award..."
                                    />

                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., Best Picture, Best Foreign Film"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Award Winning Movie'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Award Actor Modal */}
                            {activeModal === 'awardActor' && (
                                <form onSubmit={(e) => { e.preventDefault(); addAwardActor(); }}>
                                    <SearchField
                                        label="Select Award *"
                                        searchTerm={awardSearchTerm}
                                        setSearchTerm={setAwardSearchTerm}
                                        results={awardResults}
                                        onSelect={setSelectedAward}
                                        selected={selectedAward}
                                        renderResult = {(award) => (
    <div className="flex justify-between items-center">
        <span>{award.name} {award.year ? `(${award.year})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Award ID: {award.award_id}</span>
    </div>
)}
                                        placeholder="Search for an award..."
                                    />

                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Person *"
                                        searchTerm={personSearchTerm}
                                        setSearchTerm={setPersonSearchTerm}
                                        results={personResults}
                                        onSelect={setSelectedPerson}
                                        selected={selectedPerson}
                                        renderResult = {(person) => (
    <div className="flex justify-between items-center">
        <span>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</span>
        <span className="text-xs text-gray-400 ml-2">Person ID: {person.person_id}</span>
    </div>
)}

                                        placeholder="Search for a person..."
                                    />

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., Best Actor, Best Supporting Actor"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Award Winning Actor'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Award Director Modal */}
                            {activeModal === 'awardDirector' && (
                                <form onSubmit={(e) => { e.preventDefault(); addAwardDirector(); }}>
                                    <SearchField
                                        label="Select Award *"
                                        searchTerm={awardSearchTerm}
                                        setSearchTerm={setAwardSearchTerm}
                                        results={awardResults}
                                        onSelect={setSelectedAward}
                                        selected={selectedAward}
                                        renderResult = {(award) => (
    <div className="flex justify-between items-center">
        <span>{award.name} {award.year ? `(${award.year})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Award ID: {award.award_id}</span>
    </div>
)}
                                        placeholder="Search for an award..."
                                    />

                                    <SearchField
                                        label="Select Movie *"
                                        searchTerm={movieSearchTerm}
                                        setSearchTerm={setMovieSearchTerm}
                                        results={movieResults}
                                        onSelect={setSelectedMovie}
                                        selected={selectedMovie}
                                        renderResult = {(movie) => (
    <div className="flex justify-between items-center">
        <span>{movie.title} {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ''}</span>
        <span className="text-xs text-gray-400 ml-2">Movie ID: {movie.movie_id}</span>
    </div>
)}
                                        placeholder="Search for a movie..."
                                    />

                                    <SearchField
                                        label="Select Person *"
                                        searchTerm={personSearchTerm}
                                        setSearchTerm={setPersonSearchTerm}
                                        results={personResults}
                                        onSelect={setSelectedPerson}
                                        selected={selectedPerson}
                                        renderResult = {(person) => (
    <div className="flex justify-between items-center">
        <span>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</span>
        <span className="text-xs text-gray-400 ml-2">Person ID: {person.person_id}</span>
    </div>
)}

                                        placeholder="Search for a person..."
                                    />

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., Best Director, Best Screenplay"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Award Winning Director'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddRecord;