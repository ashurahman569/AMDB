import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './pages/Home';
import Search from './pages/Search';
import MovieDetails from './pages/MovieDetails';
import Loading from './components/common/Loading';
import Watchlist from './pages/Watchlist';
import Favourites from './pages/Favourites';
import PersonDetails from './pages/PersonDetails';
import AdminPanel from './pages/AdminPanel';
import Reviews from './pages/Reviews';
import Users from './pages/Users';
import './styles/index.css';
const BASE_URL = 'http://localhost:5000/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token with your backend
          const response = await fetch(`${BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Don't store token or set user - just return success
        return { success: true, message: 'Registration successful!' };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      alert('You have logged out successfully.');
      setUser(null);
    }
  };

  if (loading) {
    return <Loading/>;
  }
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Header
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetails user={user} />} />
          <Route path="/reviews/:movie_id" element={<Reviews user={user} />} />
          <Route path="/watchlist" element={<Watchlist user={user} />} />
          <Route path="/favourites" element={<Favourites user={user} />} />
          <Route path="/people/:person_id" element={<PersonDetails user={user}/>} />
          <Route path="/569adminpanel325" element={<AdminPanel user={user}/>} />
          <Route path="/569adminpanel325/users" element={<Users user={user}/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;