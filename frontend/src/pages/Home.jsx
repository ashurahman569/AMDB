import React, { useState, useEffect } from 'react';
import MovieCard from '../components/cards/MovieCard';
import Header from '../components/common/Header';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PersonCard from '../components/cards/PersonCard';

const BASE_URL = "http://localhost:5000/api";

// Custom Arrow Components  
const CustomPrevArrow = ({ className, style, onClick }) => (
  <div
    className={`${className} custom-arrow custom-prev-arrow`}
    style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '50%',
      width: '55px',
      height: '55px',
      left: '-35px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 2,
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '2px solid rgba(255,255,255,0.1)',
    }}
    onClick={onClick}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  </div>
);

const CustomNextArrow = ({ className, style, onClick }) => (
  <div
    className={`${className} custom-arrow custom-next-arrow`}
    style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '50%',
      width: '55px',
      height: '55px',
      right: '-35px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 2,
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '2px solid rgba(255,255,255,0.1)',
    }}
    onClick={onClick}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  </div>
);

// Loading Skeleton Component  
const LoadingSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="bg-gray-700 rounded-lg animate-pulse mx-auto" style={{ width: '280px', height: '420px' }}>
        <div className="w-full h-80 bg-gray-600 rounded-t-lg"></div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
          <div className="h-3 bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);

const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState({
    featured: true,
    new: true,
    people: true
  });

  useEffect(() => {
    axios.get(`${BASE_URL}/movies/featured`)
      .then((response) => {
        const data = response.data;
        console.log("✅ Connected to backend! Data:", data);
        setFeaturedMovies(Array.isArray(data.data) ? data.data : []);
      })
      .catch((error) => {
        console.error('Error fetching featured movies: ', error);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, featured: false }));
      });
  }, []);

  useEffect(() => {
    axios.get(`${BASE_URL}/movies/new`)
      .then((response) => {
        const data = response.data;
        console.log("✅ Connected to backend! New Movies Data:", data);
        setNewMovies(Array.isArray(data.data) ? data.data : []);
      })
      .catch((error) => {
        console.error('Error fetching new movies: ', error);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, new: false }));
      });
  }, []);

  useEffect(() => {
    axios.get(`${BASE_URL}/people/borntoday`)
      .then((response) => {
        const data = response.data;
        console.log("✅ Connected to backend! People Data:", data);
        setPeople(Array.isArray(data.data) ? data.data : []);
      })
      .catch((error) => {
        console.error('Error fetching people: ', error);
      })
      .finally(() => {
        setLoading(prev => ({ ...prev, people: false }));
      });
  }, []);

  const movieSliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    centerMode: false,
    variableWidth: false,
    adaptiveHeight: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ],
    dotsClass: "slick-dots custom-dots",
  };

  const personSliderSettings = {
    dots: true,
    infinite: people.length > 5,
    speed: 600,
    slidesToShow: Math.min(5, people.length),
    slidesToScroll: 2,
    autoplay: people.length > 5,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(4, people.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, people.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, people.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ],
    dotsClass: "slick-dots custom-dots",
  };

  const SectionTitle = ({ children, gradient = "from-blue-400 to-purple-500" }) => (
    <h1 className={`mt-16 mb-12 text-4xl md:text-5xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent text-center tracking-tight`}>
      {children}
    </h1>
  );

  return (
    <>
      <style jsx>{`  
        .custom-arrow:hover {  
          transform: translateY(-50%) scale(1.1) !important;  
          box-shadow: 0 12px 35px rgba(0,0,0,0.4) !important;  
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;  
        }  
          
        .custom-dots {  
          bottom: -50px !important;  
        }  
          
        .custom-dots li button:before {  
          font-size: 12px !important;  
          color: rgba(255,255,255,0.5) !important;  
          transition: all 0.3s ease !important;  
        }  
          
        .custom-dots li.slick-active button:before {  
          color: #667eea !important;  
          transform: scale(1.2) !important;  
        }  
          
        .custom-dots li button:hover:before {  
          color: #764ba2 !important;  
        }  
          
        .slider-container {  
          position: relative;  
          padding: 0 60px;  
          margin: 0 auto;  
          max-width: 1300px;  
          margin-bottom: 80px;  
        }  
          
        .slick-slider {  
          position: relative;  
        }  
          
        .slick-list {  
          margin: 0;  
          padding: 20px 0 40px 0;  
          overflow: hidden;  
        }  
          
        .slick-slide {  
          padding: 0 15px;  
          box-sizing: border-box;  
          display: flex !important;  
          justify-content: center !important;  
          align-items: flex-start !important;  
        }  
          
        .slick-slide > div {  
          width: 100% !important;  
          display: flex !important;  
          justify-content: center !important;  
        }  
          
        .slick-track {  
          display: flex !important;  
          align-items: flex-start !important;  
        }  
          
        .section-container {  
          opacity: 0;  
          animation: fadeInUp 0.8s ease-out forwards;  
        }  
          
        .section-container:nth-child(1) {  
          animation-delay: 0.1s;  
        }  
          
        .section-container:nth-child(2) {  
          animation-delay: 0.3s;  
        }  
          
        .section-container:nth-child(3) {  
          animation-delay: 0.5s;  
        }  
          
        @keyframes fadeInUp {  
          from {  
            opacity: 0;  
            transform: translateY(30px);  
          }  
          to {  
            opacity: 1;  
            transform: translateY(0);  
          }  
        }  
          
        .empty-state {  
          text-align: center;  
          padding: 60px 20px;  
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);  
          border-radius: 20px;  
          border: 1px solid rgba(255,255,255,0.1);  
          backdrop-filter: blur(10px);  
          margin: 0 60px;  
        }  
          
        /* Utility classes for text truncation */  
        .line-clamp-2 {  
          display: -webkit-box;  
          -webkit-line-clamp: 2;  
          -webkit-box-orient: vertical;  
          overflow: hidden;  
        }  
          
        @media (max-width: 1024px) {  
          .slider-container {  
            padding: 0 50px;  
          }  
            
          .empty-state {  
            margin: 0 50px;  
          }  
        }  
          
        @media (max-width: 640px) {  
          .slider-container {  
            padding: 0 40px;  
          }  
            
          .empty-state {  
            margin: 0 40px;  
          }  
        }  
      `}</style>

      <main className="py-8 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
        {/* Featured Movies Section */}
        <section className="section-container">
          <SectionTitle gradient="from-yellow-400 to-orange-500">
            🎬 Featured Movies
          </SectionTitle>
          <div className="slider-container">
            {loading.featured ? (
              <LoadingSkeleton count={3} />
            ) : featuredMovies.length > 0 ? (
              <Slider {...movieSliderSettings}>
                {featuredMovies.map((movie) => (
                  <div key={movie.movie_id}>
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="empty-state">
                <div className="text-6xl mb-4">🎭</div>
                <p className="text-white text-xl">No featured movies available at the moment.</p>
                <p className="text-gray-400 mt-2">Check back soon for exciting new content!</p>
              </div>
            )}
          </div>
        </section>

        {/* New Released Movies Section */}
        <section className="section-container">
          <SectionTitle gradient="from-green-400 to-blue-500">
            🆕 New Releases
          </SectionTitle>
          <div className="slider-container">
            {loading.new ? (
              <LoadingSkeleton count={3} />
            ) : newMovies.length > 0 ? (
              <Slider {...movieSliderSettings}>
                {newMovies.map((movie) => (
                  <div key={movie.movie_id}>
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="empty-state">
                <div className="text-6xl mb-4">🎪</div>
                <p className="text-white text-xl">No new releases available.</p>
                <p className="text-gray-400 mt-2">Stay tuned for the latest movies!</p>
              </div>
            )}
          </div>
        </section>

        {/* People Born Today Section */}
        <section className="section-container">
          <SectionTitle gradient="from-pink-400 to-red-500">
            🎂 Born Today
          </SectionTitle>
          <div className="slider-container">
            {loading.people ? (
              <LoadingSkeleton count={5} />
            ) : people.length > 0 ? (
              <Slider {...personSliderSettings}>
                {people.map((person) => (
                  <div key={person.person_id}>
                    <PersonCard person={person} />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="empty-state">
                <div className="text-6xl mb-4">🎈</div>
                <p className="text-white text-xl">No birthdays today.</p>
                <p className="text-gray-400 mt-2">Come back tomorrow to see who's celebrating!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;  