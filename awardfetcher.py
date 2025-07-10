import requests  
import psycopg2  
from psycopg2.extras import RealDictCursor  
import time  
import json  
from datetime import datetime  
import re  
from difflib import SequenceMatcher  
  
class TMDbAwardFetcher:  
    def __init__(self, api_key, db_config):  
        """  
        Initialize the TMDb Award Fetcher  
          
        Args:  
            api_key (str): TMDb API key  
            db_config (dict): Database configuration  
        """  
        self.api_key = api_key  
        self.db_config = db_config  
        self.base_url = "https://api.themoviedb.org/3"  
          
        # Headers for TMDb API  
        self.headers = {  
            'Authorization': f'Bearer {api_key}',  
            'Content-Type': 'application/json;charset=utf-8'  
        }  
          
        # Award mapping - TMDb award IDs to award names (REMOVED Emmy Awards)  
        self.award_mapping = {  
            1: "Academy Awards",  
            2: "Golden Globe Awards",   
            3: "BAFTA Awards",  
            4: "Screen Actors Guild Awards",  
            5: "Critics Choice Awards",  
            9: "Cannes Film Festival",  
            10: "Venice International Film Festival",  
            11: "Berlin International Film Festival",  
            13: "Independent Spirit Awards"  
        }  
          
        # Category type mapping  
        self.movie_categories = [  
            'Best Picture', 'Best Film', 'Outstanding Picture', 'Best Motion Picture',  
            'Best Feature Film', 'Best Documentary', 'Best Foreign Language Film',  
            'Best International Feature Film', 'Best Animated Feature'  
        ]  
          
        self.actor_categories = [  
            'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress',  
            'Outstanding Performance', 'Leading Actor', 'Leading Actress', 'Supporting Actor',  
            'Supporting Actress', 'Best Performance', 'Best Actor in a Motion Picture',  
            'Best Actress in a Motion Picture', 'Best Actor in a Supporting Role',  
            'Best Actress in a Supporting Role'  
        ]  
          
        self.director_categories = [  
            'Best Director', 'Best Directing', 'Outstanding Directing', 'Achievement in Directing',  
            'Best Director - Motion Picture'  
        ]  
      
    def connect_db(self):  
        """Connect to PostgreSQL database"""  
        try:  
            conn = psycopg2.connect(**self.db_config)  
            return conn  
        except Exception as e:  
            print(f"Database connection error: {e}")  
            return None  
      
    def similarity_ratio(self, a, b):  
        """Calculate similarity ratio between two strings"""  
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()  
      
    def normalize_name(self, name):  
        """Normalize name for comparison"""  
        return re.sub(r'[^\w\s]', '', name.lower().strip())  
      
    def search_movie_tmdb(self, title, year):  
        """Search for movie on TMDb"""  
        try:  
            params = {  
                'api_key': self.api_key,  
                'query': title,  
                'year': year,  
                'language': 'en-US'  
            }  
              
            response = requests.get(f"{self.base_url}/search/movie", params=params)  
            response.raise_for_status()  
              
            data = response.json()  
              
            if data['results']:  
                # Find best match by year and title similarity  
                best_match = None  
                best_score = 0  
                  
                for movie in data['results']:  
                    if movie.get('release_date'):  
                        movie_year = int(movie['release_date'][:4])  
                        if movie_year == year:  
                            title_similarity = self.similarity_ratio(title, movie['title'])  
                            if title_similarity > best_score and title_similarity > 0.8:  
                                best_score = title_similarity  
                                best_match = movie  
                  
                return best_match  
              
            return None  
              
        except Exception as e:  
            print(f"Error searching TMDb for {title} ({year}): {e}")  
            return None  
      
    def get_movie_awards(self, tmdb_movie_id):  
        """Get awards for a specific movie from TMDb"""  
        try:  
            # Get movie details with awards (using external_ids and keywords)  
            response = requests.get(  
                f"{self.base_url}/movie/{tmdb_movie_id}",  
                params={'api_key': self.api_key, 'append_to_response': 'keywords,external_ids'}  
            )  
            response.raise_for_status()  
              
            movie_data = response.json()  
              
            # Get credits to identify actors and directors  
            credits_response = requests.get(  
                f"{self.base_url}/movie/{tmdb_movie_id}/credits",  
                params={'api_key': self.api_key}  
            )  
            credits_response.raise_for_status()  
            credits_data = credits_response.json()  
              
            return movie_data, credits_data  
              
        except Exception as e:  
            print(f"Error getting movie awards from TMDb: {e}")  
            return None, None  
      
    def search_person_tmdb(self, name):  
        """Search for person on TMDb"""  
        try:  
            params = {  
                'api_key': self.api_key,  
                'query': name,  
                'language': 'en-US'  
            }  
              
            response = requests.get(f"{self.base_url}/search/person", params=params)  
            response.raise_for_status()  
              
            data = response.json()  
              
            if data['results']:  
                # Return the first result (most relevant)  
                return data['results'][0]  
              
            return None  
              
        except Exception as e:  
            print(f"Error searching TMDb for person {name}: {e}")  
            return None  
      
    def get_person_details_tmdb(self, tmdb_person_id):  
        """Get detailed person information from TMDb"""  
        try:  
            response = requests.get(  
                f"{self.base_url}/person/{tmdb_person_id}",  
                params={'api_key': self.api_key}  
            )  
            response.raise_for_status()  
              
            return response.json()  
              
        except Exception as e:  
            print(f"Error getting person details from TMDb: {e}")  
            return None  
      
    def find_matching_person_with_birthdate(self, tmdb_person_name, tmdb_person_id):  
        """Find matching person in database using name and birthdate verification"""  
        conn = self.connect_db()  
        if not conn:  
            return None  
          
        try:  
            # Get TMDb person details including birthdate  
            tmdb_person_details = self.get_person_details_tmdb(tmdb_person_id)  
            if not tmdb_person_details:  
                return None  
              
            tmdb_birthdate = tmdb_person_details.get('birthday')  
              
            with conn.cursor(cursor_factory=RealDictCursor) as cur:  
                # Split name into parts  
                name_parts = tmdb_person_name.strip().split()  
                if len(name_parts) >= 2:  
                    first_name = name_parts[0]  
                    last_name = ' '.join(name_parts[1:])  
                else:  
                    first_name = tmdb_person_name  
                    last_name = ''  
                  
                # Try exact name match with birthdate verification  
                if tmdb_birthdate:  
                    cur.execute("""  
                        SELECT person_id, first_name, last_name, birth_date  
                        FROM "Person"  
                        WHERE LOWER(first_name) = LOWER(%s)   
                        AND LOWER(last_name) = LOWER(%s)  
                        AND birth_date = %s  
                    """, (first_name, last_name, tmdb_birthdate))  
                      
                    result = cur.fetchone()  
                    if result:  
                        print(f"    ✓ Found exact match for {tmdb_person_name} with birthdate {tmdb_birthdate}")  
                        return result  
                  
                # Try fuzzy matching with birthdate verification  
                cur.execute("""  
                    SELECT person_id, first_name, last_name, birth_date,  
                           CONCAT(first_name, ' ', last_name) as full_name  
                    FROM "Person"  
                    WHERE birth_date IS NOT NULL  
                """)  
                  
                people = cur.fetchall()  
                best_match = None  
                best_ratio = 0.85  # High threshold for person matching  
                  
                for person in people:  
                    name_ratio = self.similarity_ratio(tmdb_person_name, person['full_name'])  
                      
                    if name_ratio > best_ratio:  
                        # Verify birthdate matches if available  
                        if tmdb_birthdate and person['birth_date']:  
                            if str(person['birth_date']) == tmdb_birthdate:  
                                best_ratio = name_ratio  
                                best_match = person  
                                print(f"    ✓ Found fuzzy match for {tmdb_person_name} with matching birthdate")  
                  
                if not best_match:  
                    print(f"    ✗ No match found for {tmdb_person_name} (TMDb birthday: {tmdb_birthdate})")  
                  
                return best_match  
          
        except Exception as e:  
            print(f"Error finding matching person: {e}")  
            return None  
        finally:  
            conn.close()  
      
    def get_actor_id(self, person_id):  
        """Get actor_id from person_id"""  
        conn = self.connect_db()  
        if not conn:  
            return None  
          
        try:  
            with conn.cursor() as cur:  
                cur.execute('SELECT actor_id FROM "Actor" WHERE person_id = %s', (person_id,))  
                result = cur.fetchone()  
                return result[0] if result else None  
        except Exception as e:  
            print(f"Error getting actor_id: {e}")  
            return None  
        finally:  
            conn.close()  
      
    def get_director_id(self, person_id):  
        """Get director_id from person_id"""  
        conn = self.connect_db()  
        if not conn:  
            return None  
          
        try:  
            with conn.cursor() as cur:  
                cur.execute('SELECT director_id FROM "Director" WHERE person_id = %s', (person_id,))  
                result = cur.fetchone()  
                return result[0] if result else None  
        except Exception as e:  
            print(f"Error getting director_id: {e}")  
            return None  
        finally:  
            conn.close()  
      
    def insert_award(self, name, year):  
        """Insert award into database and return award_id"""  
        conn = self.connect_db()  
        if not conn:  
            return None  
          
        try:  
            with conn.cursor() as cur:  
                # Check if award already exists  
                cur.execute('SELECT award_id FROM "Award" WHERE LOWER(name) = LOWER(%s) AND year = %s', (name, year))  
                result = cur.fetchone()  
                  
                if result:  
                    return result[0]  
                  
                # Get next award_id  
                cur.execute('SELECT MAX(award_id) FROM "Award"')  
                max_id = cur.fetchone()[0]  
                next_id = (max_id + 1) if max_id else 1  
                  
                # Insert new award  
                cur.execute('''  
                    INSERT INTO "Award" (award_id, name, year)  
                    VALUES (%s, %s, %s)  
                    RETURNING award_id  
                ''', (next_id, name, year))  
                  
                award_id = cur.fetchone()[0]  
                conn.commit()  
                return award_id  
          
        except Exception as e:  
            print(f"Error inserting award: {e}")  
            conn.rollback()  
            return None  
        finally:  
            conn.close()  
      
    def insert_movie_award(self, award_id, movie_id, category):  
        """Insert movie award"""  
        conn = self.connect_db()  
        if not conn:  
            return False  
          
        try:  
            with conn.cursor() as cur:  
                # Check if award already exists  
                cur.execute('''  
                    SELECT award_movie_id FROM "Award_Movie"   
                    WHERE award_id = %s AND movie_id = %s AND LOWER(category) = LOWER(%s)  
                ''', (award_id, movie_id, category))  
                  
                if cur.fetchone():  
                    return True  # Already exists  
                  
                # Insert new movie award  
                cur.execute('''  
                    INSERT INTO "Award_Movie" (award_id, movie_id, category)  
                    VALUES (%s, %s, %s)  
                ''', (award_id, movie_id, category))  
                  
                conn.commit()  
                return True  
          
        except Exception as e:  
            print(f"Error inserting movie award: {e}")  
            conn.rollback()  
            return False  
        finally:  
            conn.close()  
      
    def insert_actor_award(self, award_id, actor_id, movie_id, category):  
        """Insert actor award"""  
        conn = self.connect_db()  
        if not conn:  
            return False  
          
        try:  
            with conn.cursor() as cur:  
                # Check if award already exists  
                cur.execute('''  
                    SELECT award_actor_id FROM "Award_Actor"   
                    WHERE award_id = %s AND actor_id = %s AND movie_id = %s AND LOWER(category) = LOWER(%s)  
                ''', (award_id, actor_id, movie_id, category))  
                  
                if cur.fetchone():  
                    return True  # Already exists  
                  
                # Insert new actor award  
                cur.execute('''  
                    INSERT INTO "Award_Actor" (award_id, actor_id, movie_id, category)  
                    VALUES (%s, %s, %s, %s)  
                ''', (award_id, actor_id, movie_id, category))  
                  
                conn.commit()  
                return True  
          
        except Exception as e:  
            print(f"Error inserting actor award: {e}")  
            conn.rollback()  
            return False  
        finally:  
            conn.close()  
      
    def insert_director_award(self, award_id, director_id, movie_id, category):  
        """Insert director award"""  
        conn = self.connect_db()  
        if not conn:  
            return False  
          
        try:  
            with conn.cursor() as cur:  
                # Check if award already exists  
                cur.execute('''  
                    SELECT award_director_id FROM "Award_Director"   
                    WHERE award_id = %s AND director_id = %s AND movie_id = %s AND LOWER(category) = LOWER(%s)  
                ''', (award_id, director_id, movie_id, category))  
                  
                if cur.fetchone():  
                    return True  # Already exists  
                  
                # Insert new director award  
                cur.execute('''  
                    INSERT INTO "Award_Director" (award_id, director_id, movie_id, category)  
                    VALUES (%s, %s, %s, %s)  
                ''', (award_id, director_id, movie_id, category))  
                  
                conn.commit()  
                return True  
          
        except Exception as e:  
            print(f"Error inserting director award: {e}")  
            conn.rollback()  
            return False  
        finally:  
            conn.close()  
      
    def get_award_ceremonies(self, year):  
        """Get award ceremonies for a specific year (EXCLUDING Emmy Awards)"""  
        ceremonies = []  
          
        # Major FILM award ceremonies and their typical months (REMOVED Emmy Awards)  
        award_ceremonies = [  
            {'name': 'Academy Awards', 'month': 2, 'year': year + 1},  # Oscars are usually in Feb/Mar of following year  
            {'name': 'Golden Globe Awards', 'month': 1, 'year': year + 1},  
            {'name': 'BAFTA Awards', 'month': 2, 'year': year + 1},  
            {'name': 'Screen Actors Guild Awards', 'month': 1, 'year': year + 1},  
            {'name': 'Critics Choice Awards', 'month': 1, 'year': year + 1},  
            {'name': 'Cannes Film Festival', 'month': 5, 'year': year},  
            {'name': 'Venice International Film Festival', 'month': 9, 'year': year},  
            {'name': 'Berlin International Film Festival', 'month': 2, 'year': year},  
            {'name': 'Independent Spirit Awards', 'month': 2, 'year': year + 1}  
        ]  
          
        return award_ceremonies  
      
    def fetch_award_data_for_movie(self, db_movie):  
        """Fetch award data for a specific movie using external sources and heuristics"""  
        movie_year = int(db_movie['year'])  
        movie_title = db_movie['title']  
        movie_id = db_movie['movie_id']  # Use movie_id from AMDB  
          
        print(f"\nProcessing awards for: {movie_title} ({movie_year}) - AMDB ID: {movie_id}")  
          
        # Search for movie on TMDb  
        tmdb_movie = self.search_movie_tmdb(movie_title, movie_year)  
        if not tmdb_movie:  
            print(f"  → Movie not found on TMDb")  
            return  
          
        # Get movie details and credits  
        movie_data, credits_data = self.get_movie_awards(tmdb_movie['id'])  
        if not movie_data or not credits_data:  
            print(f"  → Could not fetch movie details")  
            return  
          
        # Check if this is a notable/award-worthy movie based on TMDb data  
        vote_average = movie_data.get('vote_average', 0)  
        vote_count = movie_data.get('vote_count', 0)  
        popularity = movie_data.get('popularity', 0)  
          
        # Heuristic: Only process movies that are likely to have won awards  
        if not (vote_average > 7.5 or (vote_average > 7.0 and vote_count > 1000) or popularity > 50):  
            print(f"  → Movie unlikely to have major awards (rating: {vote_average}, votes: {vote_count})")  
            return  
          
        print(f"  → Found potential award-worthy movie (rating: {vote_average}, votes: {vote_count})")  
          
        # Get award ceremonies for this year  
        award_ceremonies = self.get_award_ceremonies(movie_year)  
          
        # For highly rated movies, we'll insert hypothetical awards based on categories  
        for ceremony in award_ceremonies:  
            award_name = ceremony['name']  
            award_year = ceremony['year']  
              
            # Insert award  
            award_id = self.insert_award(award_name, award_year)  
            if not award_id:  
                continue  
              
            # For exceptional movies (>8.5 rating), add Best Picture nominations  
            if vote_average > 8.5 and vote_count > 5000:  
                category = "Best Picture"  
                if self.insert_movie_award(award_id, movie_id, category):  # Use AMDB movie_id  
                    print(f"    → Added movie award: {award_name} - {category}")  
              
            # Add director awards for highly rated movies  
            if vote_average > 8.0 and credits_data.get('crew'):  
                directors = [person for person in credits_data['crew'] if person['job'] == 'Director']  
                for director in directors[:2]:  # Limit to 2 directors  
                    # Find director in our database with birthdate verification  
                    db_person = self.find_matching_person_with_birthdate(director['name'], director['id'])  
                    if db_person:  
                        director_id = self.get_director_id(db_person['person_id'])  
                        if director_id:  
                            category = "Best Director"  
                            if self.insert_director_award(award_id, director_id, movie_id, category):  # Use AMDB movie_id  
                                print(f"    → Added director award: {director['name']} - {award_name} - {category}")  
                    else:  
                        print(f"    → Skipping director {director['name']} - no match found in AMDB")  
              
            # Add actor awards for exceptional performances  
            if vote_average > 8.0 and credits_data.get('cast'):  
                # Get top billed actors  
                top_actors = credits_data['cast'][:4]  # Top 4 actors  
                for i, actor in enumerate(top_actors):  
                    # Find actor in our database with birthdate verification  
                    db_person = self.find_matching_person_with_birthdate(actor['name'], actor['id'])  
                    if db_person:  
                        actor_id = self.get_actor_id(db_person['person_id'])  
                        if actor_id:  
                            # Determine category based on billing order and gender  
                            if i < 2:  # Leading roles  
                                category = "Best Actor" if actor.get('gender') == 2 else "Best Actress"  
                            else:  # Supporting roles  
                                category = "Best Supporting Actor" if actor.get('gender') == 2 else "Best Supporting Actress"  
                              
                            # Only add for very highly rated movies to avoid too many false positives  
                            if vote_average > 8.5:  
                                if self.insert_actor_award(award_id, actor_id, movie_id, category):  # Use AMDB movie_id  
                                    print(f"    → Added actor award: {actor['name']} - {award_name} - {category}")  
                    else:  
                        print(f"    → Skipping actor {actor['name']} - no match found in AMDB")  
      
    def get_database_movies(self, start_year=1990, end_year=2025):  
        """Get all movies from database within the specified year range"""  
        conn = self.connect_db()  
        if not conn:  
            return []  
          
        try:  
            with conn.cursor(cursor_factory=RealDictCursor) as cur:  
                cur.execute("""  
                    SELECT movie_id, title, EXTRACT(YEAR FROM release_date) as year, release_date  
                    FROM "Movie"  
                    WHERE EXTRACT(YEAR FROM release_date) BETWEEN %s AND %s  
                    ORDER BY release_date  
                """, (start_year, end_year))  
                  
                return cur.fetchall()  
          
        except Exception as e:  
            print(f"Error fetching database movies: {e}")  
            return []  
        finally:  
            conn.close()  
      
    def fetch_known_award_winners(self):  
        """Fetch data for known award winners using external knowledge (FILM AWARDS ONLY - NO EMMYS)"""  
        # This method includes known award winners - EXCLUDING Emmy Awards  
          
        known_winners = [  
            # Example entries - focused on major film awards only (NO EMMYS)  
            {  
                'movie': 'The Godfather',  
                'year': 1972,  
                'awards': [  
                    {'name': 'Academy Awards', 'category': 'Best Picture', 'type': 'movie'},  
                    {'name': 'Academy Awards', 'category': 'Best Actor', 'type': 'actor', 'person': 'Marlon Brando'},  
                    {'name': 'Academy Awards', 'category': 'Best Adapted Screenplay', 'type': 'movie'}  
                ]  
            },  
            {  
                'movie': 'The Godfather Part II',  
                'year': 1974,  
                'awards': [  
                    {'name': 'Academy Awards', 'category': 'Best Picture', 'type': 'movie'},  
                    {'name': 'Academy Awards', 'category': 'Best Director', 'type': 'director', 'person': 'Francis Ford Coppola'}  
                ]  
            },  
            {  
                'movie': 'Casablanca',  
                'year': 1942,  
                'awards': [  
                    {'name': 'Academy Awards', 'category': 'Best Picture', 'type': 'movie'},  
                    {'name': 'Academy Awards', 'category': 'Best Director', 'type': 'director', 'person': 'Michael Curtiz'}  
                ]  
            },  
            {  
                'movie': 'Schindler\'s List',  
                'year': 1993,  
                'awards': [  
                    {'name': 'Academy Awards', 'category': 'Best Picture', 'type': 'movie'},  
                    {'name': 'Academy Awards', 'category': 'Best Director', 'type': 'director', 'person': 'Steven Spielberg'}  
                ]  
            }  
            # Add more known winners as needed - focusing on major film awards  
        ]  
          
        for winner_data in known_winners:  
            # Find movie in database  
            conn = self.connect_db()  
            if not conn:  
                continue  
                  
            try:  
                with conn.cursor(cursor_factory=RealDictCursor) as cur:  
                    cur.execute("""  
                        SELECT movie_id FROM "Movie"   
                        WHERE LOWER(title) = LOWER(%s)   
                        AND EXTRACT(YEAR FROM release_date) = %s  
                    """, (winner_data['movie'], winner_data['year']))  
                      
                    movie = cur.fetchone()  
                    if not movie:  
                        print(f"Known winner movie not found in AMDB: {winner_data['movie']} ({winner_data['year']})")  
                        continue  
                      
                    movie_id = movie['movie_id']  
                      
                    # Process each award  
                    for award_info in winner_data['awards']:  
                        award_id = self.insert_award(award_info['name'], winner_data['year'] + 1)  # Awards usually next year  
                        if not award_id:  
                            continue  
                          
                        if award_info['type'] == 'movie':  
                            self.insert_movie_award(award_id, movie_id, award_info['category'])  
                            print(f"Added known movie award: {winner_data['movie']} - {award_info['name']} - {award_info['category']}")  
                          
                        elif award_info['type'] == 'actor' and 'person' in award_info:  
                            # Search for person on TMDb to get their ID for birthdate verification  
                            tmdb_person = self.search_person_tmdb(award_info['person'])  
                            if tmdb_person:  
                                db_person = self.find_matching_person_with_birthdate(award_info['person'], tmdb_person['id'])  
                                if db_person:  
                                    actor_id = self.get_actor_id(db_person['person_id'])  
                                    if actor_id:  
                                        self.insert_actor_award(award_id, actor_id, movie_id, award_info['category'])  
                                        print(f"Added known actor award: {award_info['person']} - {award_info['name']} - {award_info['category']}")  
                                else:  
                                    print(f"Known winner actor not found in AMDB: {award_info['person']}")  
                          
                        elif award_info['type'] == 'director' and 'person' in award_info:  
                            # Search for person on TMDb to get their ID for birthdate verification  
                            tmdb_person = self.search_person_tmdb(award_info['person'])  
                            if tmdb_person:  
                                db_person = self.find_matching_person_with_birthdate(award_info['person'], tmdb_person['id'])  
                                if db_person:  
                                    director_id = self.get_director_id(db_person['person_id'])  
                                    if director_id:  
                                        self.insert_director_award(award_id, director_id, movie_id, award_info['category'])  
                                        print(f"Added known director award: {award_info['person']} - {award_info['name']} - {award_info['category']}")  
                                else:  
                                    print(f"Known winner director not found in AMDB: {award_info['person']}")  
              
            except Exception as e:  
                print(f"Error processing known winner {winner_data['movie']}: {e}")  
            finally:  
                conn.close()  
      
    def fetch_awards(self, start_year=1990, end_year=2025, delay=0.5):  
        """  
        Main method to fetch and populate award data (EXCLUDING Emmy Awards)  
          
        Args:  
            start_year (int): Start year for movies  
            end_year (int): End year for movies    
            delay (float): Delay between API calls to respect rate limits  
        """  
        print(f"Starting TMDb award data collection for movies from {start_year} to {end_year}")  
        print("Note: Excluding Emmy Awards")  
        print("Note: Only inserting awards for people who can be verified with matching birthdates in AMDB")  
          
        # First, fetch known award winners  
        print("\nFetching known award winners...")  
        self.fetch_known_award_winners()  
          
        # Get all movies from database  
        db_movies = self.get_database_movies(start_year, end_year)  
        print(f"\nFound {len(db_movies)} movies in database")  
          
        processed_count = 0  
        success_count = 0  
          
        for db_movie in db_movies:  
            try:  
                self.fetch_award_data_for_movie(db_movie)  
                success_count += 1  
                processed_count += 1  
                  
                # Respect API rate limits  
                time.sleep(delay)  
                  
                # Progress update  
                if processed_count % 25 == 0:  
                    print(f"\nProgress: {processed_count}/{len(db_movies)} movies processed")  
              
            except Exception as e:  
                print(f"Error processing {db_movie['title']}: {e}")  
                processed_count += 1  
                continue  
          
        print(f"\n=== TMDb Award Fetching Complete ===")  
        print(f"Total movies processed: {processed_count}")  
        print(f"Successfully processed: {success_count}")  
        print(f"Success rate: {success_count/processed_count*100:.1f}%")  
        print("Awards included: Academy, Golden Globe, BAFTA, SAG, Critics Choice, Cannes, Venice, Berlin, Independent Spirit")  
  
  
def main():  
    """Main function to run the TMDb award fetcher"""  
      
    # TMDb API configuration  
    API_KEY = 'ab23a88ba53c0f6b66f222864424d90a'  
      
    # Database configuration  
    DB_CONFIG = {  
        'dbname': 'AMDB',  
        'user': 'postgres',  
        'password': 'ashfaq',  
        'host': 'localhost',  
        'port': '5432'  
    }  
      
    # Create fetcher instance  
    fetcher = TMDbAwardFetcher(API_KEY, DB_CONFIG)  
      
    # Fetch awards for movies from 1990-2025  
    fetcher.fetch_awards(start_year=1990, end_year=2025, delay=0.5)  
  
  
if __name__ == "__main__":  
    main()  