import React, { useState, useEffect } from 'react';
import MovieCard from '../components/cards/MovieCard';
import Header from '../components/common/Header';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PersonCard from '../components/cards/PersonCard';

const BASE_URL = "http://localhost:5000/api";

const Home = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
  axios.get(`${BASE_URL}/movies/featured`)
    .then((response) => {
      const data = response.data;
      console.log("✅ Connected to backend! Data:", data);
      setFeaturedMovies(Array.isArray(data.data) ? data.data : []);
    })
    .catch((error) => {
      console.error('Error fetching featured movies: ', error);
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
      });
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
  };

  const sliderPerson = {
  dots: true,
  infinite: people.length > 5,  // infinite only if more than 5 people
  speed: 500,
  slidesToShow: Math.min(5, people.length),  // show at most 5 or less if fewer people
  slidesToScroll: 1,
  arrows: true,
};


  return (
    <>
      <main className="py-5 px-4 bg-gray-800">
        <section className="browse-section">
          <h1 className="mt-10 text-white text-3xl">Featured Movies:</h1>
          <div className="browse-movies max-w-6xl mx-auto">
            {featuredMovies.length > 0 ? (
              <Slider {...sliderSettings}>
                {featuredMovies.map((movie) => (
                  <MovieCard key={movie.movie_id} movie={movie} />
                ))}
              </Slider>
            ) : (
              <p className="text-white">No featured movies available.</p>
            )}
          </div>
          <h1 className="mt-10 text-white text-3xl"><br></br>New Released:</h1>
          <div className="browse-movies max-w-6xl mx-auto">
            {newMovies.length > 0 ? (
              <Slider {...sliderSettings}>
                {newMovies.map((movie) => (
                  <MovieCard key={movie.movie_id} movie={movie} />
                ))}
              </Slider>
            ) : (
              <p className="text-white">No new released movies available.</p>
            )}
          </div>
          <h1 className="mt-10 text-white text-3xl"><br></br>People Born Today:</h1>
          <div className="browse-people max-w-7xl mx-auto mt-4">
            {people.length > 0 ? (
              <Slider {...sliderPerson}>
                {people.map((person) => (
                  <PersonCard key={person.person_id} person={person} />
                ))}
              </Slider>
            ) : (
              <p className="text-white">No people born today.</p>
            )}
            </div>
        </section>
      </main>
    </>
  );
};

export default Home;
