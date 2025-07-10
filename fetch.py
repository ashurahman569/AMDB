import requests
import psycopg2
import re
from datetime import datetime

# TMDb API configuration
API_KEY = 'ab23a88ba53c0f6b66f222864424d90a'
BASE_URL = 'https://api.themoviedb.org/3'

# Database configuration
DB_CONFIG = {
    'dbname': 'AMDB',
    'user': 'postgres',
    'password': 'ashfaq',
    'host': 'localhost',
    'port': '5432'
}

# Regex patterns for validation
VALID_CHAR_PATTERN = re.compile(r'^[A-Za-z0-9 ,.\':\-()&!?]+$')
VALID_NAME_PATTERN = re.compile(r"^[A-Za-z .'\-]+$")

def contains_only_valid_chars(text):
    """Check if text contains only valid characters."""
    if text is None or text.strip() == '':
        return False
    return bool(VALID_CHAR_PATTERN.match(text.strip()))

def contains_only_valid_chars_person(name):
    """Check if person name contains only valid characters."""
    if name is None or name.strip() == '':
        return False
    return bool(VALID_NAME_PATTERN.match(name.strip()))

def extract_country_from_place(place_of_birth):
    """Extract country name from place_of_birth string."""
    if not place_of_birth or not place_of_birth.strip():
        return None
    
    # Split by comma and take the last part (usually the country)
    parts = place_of_birth.strip().split(',')
    if parts:
        country = parts[-1].strip()
        # Remove common prefixes and clean up
        country = country.replace('United States of America', 'USA')
        country = country.replace('United Kingdom', 'UK')
        return country if country else None
    return None

def extract_birthplace_from_place(place_of_birth):
    """Extract birthplace (city, state, country) from place_of_birth string."""
    if not place_of_birth or not place_of_birth.strip():
        return None
    return place_of_birth.strip()

def split_name(full_name):
    """Split a full name into first_name and last_name."""
    if not full_name or not full_name.strip():
        return None, None
    
    parts = full_name.strip().split(' ')
    first_name = parts[0]
    last_name = ' '.join(parts[1:]) if len(parts) > 1 else None
    return first_name, last_name

def safe_int(value):
    """Safely convert value to int."""
    try:
        return int(value) if value is not None else None
    except (ValueError, TypeError):
        return None

def safe_float(value):
    """Safely convert value to float."""
    try:
        return float(value) if value is not None else None
    except (ValueError, TypeError):
        return None

# === TMDb API Calls ===
def get_discover_movies(page=1):
    """Get popular movies from TMDb discover endpoint."""
    url = f'{BASE_URL}/discover/movie'
    params = {
        'api_key': API_KEY,
        'language': 'en-US',
        'sort_by': 'popularity.desc',
        'include_adult': 'false',
        'include_video': 'false',
        'primary_release_date.gte': '1990-01-01',
        'primary_release_date.lte': '2025-12-31',
        'page': page
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching discover movies page {page}: {e}")
        return {}

def get_movie_details(movie_id):
    """Get detailed information about a specific movie."""
    try:
        response = requests.get(f'{BASE_URL}/movie/{movie_id}', 
                              params={'api_key': API_KEY, 'language': 'en-US'}, 
                              timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching movie details for {movie_id}: {e}")
        return {}

def get_movie_videos(movie_id):
    """Get trailers and other videos for a movie."""
    try:
        response = requests.get(f'{BASE_URL}/movie/{movie_id}/videos', 
                              params={'api_key': API_KEY, 'language': 'en-US'}, 
                              timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching videos for movie {movie_id}: {e}")
        return {}

def get_first_trailer_url(videos):
    """Extract the first YouTube trailer URL from videos."""
    for video in videos.get('results', []):
        if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
            key = video.get('key')
            if key:
                return f"https://www.youtube.com/watch?v={key}"
    return None

def get_mpaa_rating(movie_id):
    """Get MPAA rating for a movie."""
    url = f"{BASE_URL}/movie/{movie_id}/release_dates"
    try:
        response = requests.get(url, params={'api_key': API_KEY}, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        for result in data.get('results', []):
            if result.get('iso_3166_1') == 'US':
                for release in result.get('release_dates', []):
                    cert = release.get('certification')
                    if cert and cert.strip():
                        return cert.strip()
        return "Not Rated"
    except requests.exceptions.RequestException as e:
        print(f"Error fetching MPAA rating for movie {movie_id}: {e}")
        return "Not Rated"

def get_movie_credits(movie_id):
    """Get cast and crew information for a movie."""
    url = f"{BASE_URL}/movie/{movie_id}/credits"
    try:
        response = requests.get(url, params={'api_key': API_KEY}, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching credits for movie {movie_id}: {e}")
        return {}

def get_person_details(person_id):
    """Get detailed information about a person."""
    try:
        response = requests.get(f'{BASE_URL}/person/{person_id}', 
                              params={'api_key': API_KEY, 'language': 'en-US'}, 
                              timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching person details for {person_id}: {e}")
        return {}

# === Validation ===
def is_valid_movie(movie):
    """Check if movie data is valid for insertion."""
    try:
        # Check required fields
        if not movie.get('title') or not movie.get('release_date'):
            return False
            
        if not movie.get('overview') and not movie.get('tagline'):
            return False
            
        # Validate text fields
        title = movie.get('title', '').strip()
        if not contains_only_valid_chars(title):
            return False
            
        # Check year range
        try:
            year = int(movie['release_date'][:4])
            if not (1990 <= year <= 2025):
                return False
        except (ValueError, TypeError, KeyError):
            return False
            
        # Check runtime
        runtime = safe_int(movie.get('runtime'))
        if not runtime or runtime <= 0:
            return False
            
        # Check budget and revenue (updated thresholds)
        budget = safe_float(movie.get('budget', 0))
        revenue = safe_float(movie.get('revenue', 0))
        
        if budget < 4_000_000 and revenue < 8_000_000:
            return False
            
        return True
        
    except Exception as e:
        print(f"Error validating movie {movie.get('title', 'Unknown')}: {e}")
        return False

# === Database Operations ===
def ensure_person_exists(cur, person_id, person_data):
    """Ensure person exists in Person table."""
    try:
        # Check if person already exists
        cur.execute('SELECT person_id FROM "Person" WHERE person_id = %s', (person_id,))
        if cur.fetchone():
            return True
            
        # Get detailed person information
        person_details = get_person_details(person_id)
        if not person_details:
            person_details = person_data
            
        name = person_details.get('name') or person_data.get('name')
        if not name or not contains_only_valid_chars_person(name):
            print(f"Invalid name for person {person_id}: {name}")
            return False
            
        first_name, last_name = split_name(name)
        
        # Parse dates safely with validation
        birth_date = None
        death_date = None
        
        if person_details.get('birthday'):
            try:
                # Validate date format
                birth_date = person_details['birthday']
                if birth_date and len(birth_date) >= 10:  # YYYY-MM-DD format
                    # Test if it's a valid date
                    datetime.strptime(birth_date, '%Y-%m-%d')
                else:
                    birth_date = None
            except (ValueError, TypeError) as e:
                print(f"Invalid birth_date for person {person_id}: {person_details.get('birthday')} - {e}")
                birth_date = None
                
        if person_details.get('deathday'):
            try:
                death_date = person_details['deathday'] 
                if death_date and len(death_date) >= 10:
                    datetime.strptime(death_date, '%Y-%m-%d')
                else:
                    death_date = None
            except (ValueError, TypeError) as e:
                print(f"Invalid death_date for person {person_id}: {person_details.get('deathday')} - {e}")
                death_date = None
        
        photo_url = None
        if person_details.get('profile_path'):
            photo_url = f"https://image.tmdb.org/t/p/w500{person_details['profile_path']}"
        elif person_data.get('profile_path'):
            photo_url = f"https://image.tmdb.org/t/p/w500{person_data['profile_path']}"
        
        # Validate biography length (PostgreSQL text fields have limits)
        biography = person_details.get('biography')
        if biography and len(biography) > 10000:  # Reasonable limit
            biography = biography[:10000] + "..."
            
        # Extract birthplace from place_of_birth
        birthplace = extract_birthplace_from_place(person_details.get('place_of_birth'))
        if birthplace and len(birthplace) > 255:  # varchar limit
            birthplace = birthplace[:255]
            
        cur.execute("""
            INSERT INTO "Person" (person_id, first_name, last_name, birth_date, death_date, 
                    biography, birthplace, photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (person_id) DO NOTHING;
        """, (
            person_id,
            first_name,
            last_name,
            birth_date,
            death_date,
            biography,
            birthplace,
            photo_url
        ))
        return True
        
    except psycopg2.Error as e:
        print(f"Database error ensuring person exists {person_id}: {e}")
        print(f"Person data: {person_data}")
        # Rollback the current transaction
        cur.connection.rollback()
        return False
    except Exception as e:
        print(f"General error ensuring person exists {person_id}: {e}")
        print(f"Person data: {person_data}")
        cur.connection.rollback()
        return False

def ensure_actor_exists(cur, person_id):
    """Ensure actor record exists and return actor_id."""
    try:
        # Check if actor already exists
        cur.execute('SELECT actor_id FROM "Actor" WHERE person_id = %s', (person_id,))
        result = cur.fetchone()
        if result:
            return result[0]  # Return existing actor_id
        
        # Create new actor record - SERIAL will auto-increment the ID
        cur.execute("""
            INSERT INTO "Actor" (person_id) 
            VALUES (%s)
            RETURNING actor_id;
        """, (person_id,))
        
        actor_id = cur.fetchone()[0]
        print(f"        Created actor record with actor_id: {actor_id} for person_id: {person_id}")
        return actor_id
        
    except Exception as e:
        print(f"Error ensuring actor exists {person_id}: {e}")
        return None

def ensure_director_exists(cur, person_id):
    """Ensure director record exists and return director_id."""
    try:
        # Check if director already exists
        cur.execute('SELECT director_id FROM "Director" WHERE person_id = %s', (person_id,))
        result = cur.fetchone()
        if result:
            return result[0]  # Return existing director_id
        
        # Create new director record - SERIAL will auto-increment the ID
        cur.execute("""
            INSERT INTO "Director" (person_id) 
            VALUES (%s)
            RETURNING director_id;
        """, (person_id,))
        
        director_id = cur.fetchone()[0]
        print(f"        Created director record with director_id: {director_id} for person_id: {person_id}")
        return director_id
        
    except Exception as e:
        print(f"Error ensuring director exists {person_id}: {e}")
        return None

def ensure_writer_exists(cur, person_id):
    """Ensure writer record exists and return writer_id."""
    try:
        # Check if writer already exists
        cur.execute('SELECT writer_id FROM "Writer" WHERE person_id = %s', (person_id,))
        result = cur.fetchone()
        if result:
            return result[0]  # Return existing writer_id
        
        # Create new writer record - SERIAL will auto-increment the ID
        cur.execute("""
            INSERT INTO "Writer" (person_id) 
            VALUES (%s)
            RETURNING writer_id;
        """, (person_id,))
        
        writer_id = cur.fetchone()[0]
        print(f"        Created writer record with writer_id: {writer_id} for person_id: {person_id}")
        return writer_id
        
    except Exception as e:
        print(f"Error ensuring writer exists {person_id}: {e}")
        return None

def insert_movie(cur, movie, trailer_url, mpaa_rating):
    """Insert a movie into the Movie table."""
    try:
        release_date = None
        if movie.get('release_date'):
            try:
                release_date = datetime.strptime(movie['release_date'], '%Y-%m-%d').date()
            except Exception:
                release_date = None

        runtime = safe_int(movie.get('runtime'))
        budget = safe_float(movie.get('budget', 0))
        revenue = safe_float(movie.get('revenue', 0))

        poster_url = None
        if movie.get('poster_path'):
            poster_url = f"https://image.tmdb.org/t/p/w500{movie['poster_path']}"

        cur.execute("""
            INSERT INTO "Movie" (movie_id, title, release_date, runtime, about, plot, mpaa_rating,
                               budget, box_office, poster_url, trailer_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (movie_id) DO UPDATE SET
                title = EXCLUDED.title,
                release_date = EXCLUDED.release_date,
                runtime = EXCLUDED.runtime,
                about = EXCLUDED.about,
                plot = EXCLUDED.plot,
                mpaa_rating = EXCLUDED.mpaa_rating,
                budget = EXCLUDED.budget,
                box_office = EXCLUDED.box_office,
                poster_url = EXCLUDED.poster_url,
                trailer_url = EXCLUDED.trailer_url;
        """, (
            movie['id'],
            movie['title'].strip(),
            release_date,
            runtime,
            movie.get('tagline', '').strip() or None,
            movie.get('overview', '').strip() or None,
            mpaa_rating,
            budget,
            revenue,
            poster_url,
            trailer_url
        ))
        return True

    except Exception as e:
        print(f"Error inserting movie {movie.get('title', 'Unknown')}: {e}")
        return False

def insert_genres(cur, genres):
    """Insert genres into Genre table."""
    for genre in genres:
        try:
            cur.execute("""
                INSERT INTO "Genre" (genre_id, name)
                VALUES (%s, %s)
                ON CONFLICT (genre_id) DO NOTHING;
            """, (genre['id'], genre['name']))
        except Exception as e:
            print(f"Error inserting genre {genre.get('name', 'Unknown')}: {e}")

def insert_movie_genres(cur, movie_id, genres):
    """Link movie with genres."""
    for genre in genres:
        try:
            cur.execute("""
                INSERT INTO "Movie_Genre" (movie_id, genre_id)
                VALUES (%s, %s)
                ON CONFLICT (movie_id, genre_id) DO NOTHING;
            """, (movie_id, genre['id']))
        except Exception as e:
            print(f"Error linking movie {movie_id} with genre {genre.get('name', 'Unknown')}: {e}")

def insert_roles(cur, movie_id, cast):
    """Insert actor roles for a movie."""
    for person in cast[:10]:  # Limit to top 10 cast members
        person_id = person.get('id')
        if not person_id:
            continue
            
        if ensure_person_exists(cur, person_id, person):
            actor_id = ensure_actor_exists(cur, person_id)
            if actor_id:
                try:
                    character = person.get('character', '').strip()
                    if not character:
                        character = None
                    
                    # Check if this role already exists to avoid duplicates
                    cur.execute("""
                        SELECT role_id FROM "Role" 
                        WHERE movie_id = %s AND actor_id = %s
                    """, (movie_id, actor_id))
                    
                    if not cur.fetchone():
                        cur.execute("""
                            INSERT INTO "Role" (movie_id, actor_id, character_name)
                            VALUES (%s, %s, %s)
                            RETURNING role_id;
                        """, (movie_id, actor_id, character))
                        
                        role_id = cur.fetchone()[0]
                        print(f"      Added role_id {role_id}: {person.get('name', 'Unknown')} (actor_id: {actor_id}) as {character or 'Unknown character'}")
                        
                except Exception as e:
                    print(f"Error inserting role for movie {movie_id}, actor {actor_id}: {e}")

def insert_directors(cur, movie_id, crew):
    """Insert directors for a movie."""
    directors = [p for p in crew if p.get('job', '').lower() == 'director']
    
    for person in directors:
        person_id = person.get('id')
        if not person_id:
            continue
            
        if ensure_person_exists(cur, person_id, person):
            director_id = ensure_director_exists(cur, person_id)
            if director_id:
                try:
                    cur.execute("""
                        INSERT INTO "Movie_Director" (movie_id, director_id)
                        VALUES (%s, %s)
                        ON CONFLICT (movie_id, director_id) DO NOTHING;
                    """, (movie_id, director_id))
                    print(f"      Added director: {person.get('name', 'Unknown')} (director_id: {director_id})")
                except Exception as e:
                    print(f"Error inserting director for movie {movie_id}, director {director_id}: {e}")

def insert_writers(cur, movie_id, crew):
    """Insert writers for a movie."""
    # More comprehensive list of writer job titles
    writer_jobs = ['writer', 'screenplay', 'story', 'novel', 'author', 'screenwriter', 
                   'original story', 'adaptation', 'teleplay', 'script']
    writers = [p for p in crew if p.get('job', '').lower() in writer_jobs]
    
    for person in writers:
        person_id = person.get('id')
        if not person_id:
            continue
            
        if ensure_person_exists(cur, person_id, person):
            writer_id = ensure_writer_exists(cur, person_id)
            if writer_id:
                try:
                    # Removed basebook logic - just insert writer record
                    cur.execute("""
                        INSERT INTO "Movie_Writer" (movie_id, writer_id)
                        VALUES (%s, %s)
                        ON CONFLICT (movie_id, writer_id) DO NOTHING;
                    """, (movie_id, writer_id))
                    job_title = person.get('job', '').strip()
                    print(f"      Added writer: {person.get('name', 'Unknown')} (writer_id: {writer_id}) ({job_title})")
                except Exception as e:
                    print(f"Error inserting writer for movie {movie_id}, writer {writer_id}: {e}")

# === Main execution ===
def main():
    """Main function to fetch and store movie data."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        total_pages = 100  # Fetch 100 pages (2000 movies total: 100 pages × 20 movies/page)
        successful_movies = 0
        failed_movies = 0
        
        print(f"Starting to fetch {total_pages} pages of movies...")
        
        for page in range(47, total_pages + 1):
            print(f"\nProcessing page {page}/{total_pages}...")
            
            data = get_discover_movies(page)
            if not data.get('results'):
                print(f"No results found for page {page}")
                continue
                
            for result in data.get('results', []):
                movie_id = result.get('id')
                if not movie_id:
                    continue
                    
                print(f"  Processing movie ID: {movie_id}")
                
                try:
                    # Get detailed movie information
                    movie = get_movie_details(movie_id)
                    if not movie or not is_valid_movie(movie):
                        print(f"    Skipping invalid movie: {movie.get('title', 'Unknown')}")
                        conn.rollback()
                        failed_movies += 1
                        continue
                    
                    # Get trailer
                    videos = get_movie_videos(movie_id)
                    trailer_url = get_first_trailer_url(videos)
                    if not trailer_url:
                        print(f"    No trailer found for: {movie.get('title', 'Unknown')}")
                        conn.rollback()
                        failed_movies += 1
                        continue
                    
                    # Get MPAA rating
                    mpaa_rating = get_mpaa_rating(movie_id)
                    
                    # Insert movie
                    if not insert_movie(cur, movie, trailer_url, mpaa_rating):
                        conn.rollback()
                        failed_movies += 1
                        continue
                    
                    # Insert genres
                    genres = movie.get('genres', [])
                    if genres:
                        insert_genres(cur, genres)
                        insert_movie_genres(cur, movie_id, genres)
                    
                    # Get and insert credits
                    credits = get_movie_credits(movie_id)
                    if credits:
                        cast = credits.get('cast', [])
                        crew = credits.get('crew', [])
                        
                        # Filter crew to only directors and writers
                        directors = [p for p in crew if p.get('job', '').lower() == 'director']
                        writer_jobs = ['writer', 'screenplay', 'story', 'novel', 'author', 'screenwriter', 
                                     'original story', 'adaptation', 'teleplay', 'script']
                        writers = [p for p in crew if p.get('job', '').lower() in writer_jobs]
                        
                        print(f"    Found {len(cast)} cast members, {len(directors)} directors, and {len(writers)} writers")
                        
                        insert_roles(cur, movie_id, cast)
                        insert_directors(cur, movie_id, crew)  # Still pass full crew, function filters internally
                        insert_writers(cur, movie_id, crew)    # Still pass full crew, function filters internally
                    
                    # Commit the transaction for this movie
                    conn.commit()
                    successful_movies += 1
                    print(f"    Successfully processed: {movie.get('title', 'Unknown')}")
                    
                except psycopg2.Error as db_error:
                    print(f"    Database error processing movie {movie.get('title', 'Unknown')}: {db_error}")
                    try:
                        conn.rollback()
                    except:
                        pass
                    failed_movies += 1
                except Exception as e:
                    print(f"    General error processing movie {movie.get('title', 'Unknown')}: {e}")
                    try:
                        conn.rollback()
                    except:
                        pass
                    failed_movies += 1
        
        print(f"\n=== Summary ===")
        print(f"Successfully processed: {successful_movies} movies")
        print(f"Failed to process: {failed_movies} movies")
        print(f"Total attempted: {successful_movies + failed_movies} movies")
        
    except Exception as e:
        print(f"Database connection error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    main()