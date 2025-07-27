import psycopg2    
from selenium import webdriver    
from selenium.webdriver.common.by import By    
from selenium.webdriver.support.ui import WebDriverWait    
from selenium.webdriver.support import expected_conditions as EC    
from selenium.webdriver.chrome.options import Options    
from selenium.common.exceptions import TimeoutException, NoSuchElementException    
import time    
import re    
from datetime import datetime    
import logging    
from urllib.parse import quote_plus    
import random    
    
# Configure logging    
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')    
logger = logging.getLogger(__name__)    
    
class IMDbAwardScraper:    
    def __init__(self, db_config):    
        """    
        Initialize the scraper with database configuration    
            
        db_config: dict with keys 'host', 'database', 'user', 'password', 'port'    
        """    
        self.db_config = db_config    
        self.conn = None    
        self.driver = None    
            
        # Award mappings    
        self.target_awards = {    
            "Academy Awards": ["Oscar", "Academy Award"],    
            "Golden Globe Awards": ["Golden Globe"],    
            "BAFTA Awards": ["BAFTA"],    
            "Screen Actors Guild Awards": ["SAG Award", "Screen Actors Guild"],    
            "Critics Choice Awards": ["Critics Choice", "Critics' Choice"],    
            "Cannes Film Festival": ["Palme d'Or", "Cannes"],    
            "Venice International Film Festival": ["Golden Lion", "Venice"],    
            "Berlin International Film Festival": ["Golden Bear", "Berlin", "Berlinale"],    
            "Independent Spirit Awards": ["Independent Spirit"]    
        }    
            
        # Movie-related award categories    
        self.movie_categories = [    
            "best picture", "best film", "best motion picture", "best movie",    
            "best cinematography", "best editing", "best sound", "best music",    
            "best score", "best song", "best visual effects", "best production design",    
            "best costume design", "best makeup", "best documentary", "palme d'or",    
            "golden lion", "golden bear"    
        ]    
            
        # Director categories    
        self.director_categories = [    
            "best director", "best directing", "outstanding directing"    
        ]    
            
        # Actor categories    
        self.actor_categories = [    
            "best actor", "best actress", "best supporting actor", "best supporting actress",    
            "outstanding performance", "best male lead", "best female lead",    
            "best male supporting", "best female supporting"    
        ]    
        
    def setup_driver(self):    
        """Setup Chrome driver with enhanced options for better compatibility"""    
        chrome_options = Options()    
            
        # Basic options    
        chrome_options.add_argument("--no-sandbox")    
        chrome_options.add_argument("--disable-dev-shm-usage")    
        chrome_options.add_argument("--disable-gpu")    
        chrome_options.add_argument("--disable-web-security")    
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")    
        chrome_options.add_argument("--window-size=1920,1080")    
            
        # Enhanced user agent to avoid detection    
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")    
            
        # Disable automation indicators    
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])    
        chrome_options.add_experimental_option('useAutomationExtension', False)    
            
        # Suppress logs    
        chrome_options.add_argument("--log-level=3")    
        chrome_options.add_argument("--silent")    
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])    
            
        # Comment out headless for debugging - uncomment for production    
        chrome_options.add_argument("--headless")    
            
        try:    
            self.driver = webdriver.Chrome(options=chrome_options)    
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")    
            self.driver.implicitly_wait(10)    
            logger.info("Chrome driver setup successful")    
        except Exception as e:    
            logger.error(f"Failed to setup Chrome driver: {e}")    
            raise    
        
    def connect_db(self):    
        """Connect to PostgreSQL database"""    
        try:    
            self.conn = psycopg2.connect(**self.db_config)    
            logger.info("Database connected successfully")    
        except Exception as e:    
            logger.error(f"Database connection failed: {e}")    
            raise    
        
    def get_movies_from_db(self):    
        """Fetch all movies from database"""    
        cursor = self.conn.cursor()    
        cursor.execute('SELECT movie_id, title, release_date FROM "Movie" ORDER BY movie_id')    
        movies = cursor.fetchall()    
        cursor.close()    
        return movies    
        
    def clean_title_for_search(self, title):    
        """Clean movie title for better search results"""    
        # Remove common suffixes and prefixes    
        title = re.sub(r'\s*$.*?$\s*', '', title)  # Remove parentheses content    
        title = re.sub(r'\s*$.*?$\s*', '', title)  # Remove brackets content    
        title = re.sub(r'^(The|A|An)\s+', '', title, flags=re.IGNORECASE)  # Remove articles    
        title = re.sub(r'[^\w\s]', ' ', title)  # Replace special chars with spaces    
        title = re.sub(r'\s+', ' ', title).strip()  # Normalize whitespace    
        return title    
        
    def search_movie_on_imdb(self, title, release_year):    
        """Enhanced search for movie on IMDb with multiple strategies"""    
        try:    
            # Strategy 1: Direct title search    
            movie_url = self._search_strategy_1(title, release_year)    
            if movie_url:    
                return movie_url    
                
            # Strategy 2: Cleaned title search    
            cleaned_title = self.clean_title_for_search(title)    
            if cleaned_title != title:    
                movie_url = self._search_strategy_1(cleaned_title, release_year)    
                if movie_url:    
                    return movie_url    
                
            # Strategy 3: Year-first search    
            movie_url = self._search_strategy_2(title, release_year)    
            if movie_url:    
                return movie_url    
                
            logger.warning(f"All search strategies failed for {title} ({release_year})")    
            return None    
                
        except Exception as e:    
            logger.error(f"Error searching for {title}: {e}")    
            return None    
        
    def _search_strategy_1(self, title, release_year):    
        """Strategy 1: Standard IMDb search"""    
        try:    
            # Use proper URL encoding    
            search_query = f"{title} {release_year}"    
            encoded_query = quote_plus(search_query)    
            search_url = f"https://www.imdb.com/find/?q={encoded_query}&s=tt&ttype=ft&ref_=fn_ft"    
                
            logger.info(f"Searching with URL: {search_url}")    
                
            self.driver.get(search_url)    
                
            # Random delay to appear more human-like    
            time.sleep(random.uniform(2, 4))    
                
            # Wait for search results with multiple possible selectors    
            try:    
                WebDriverWait(self.driver, 15).until(    
                    EC.any_of(    
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".ipc-metadata-list-summary-item")),    
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".findResult")),    
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='find-results-section-title']")),    
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".titleColumn")),    
                        EC.presence_of_element_located((By.CSS_SELECTOR, "li[data-testid='find-result']"))    
                    )    
                )    
            except TimeoutException:    
                logger.warning(f"Timeout waiting for search results for {title}")    
                return None    
                
            # Try multiple selectors for finding results    
            result_selectors = [    
                ".ipc-metadata-list-summary-item",    
                "li[data-testid='find-result']",    
                ".findResult",    
                ".titleColumn",    
                ".ipc-metadata-list-summary-item__t"    
            ]    
                
            for selector in result_selectors:    
                try:    
                    results = self.driver.find_elements(By.CSS_SELECTOR, selector)    
                    if results:    
                        logger.info(f"Found {len(results)} results using selector: {selector}")    
                            
                        for i, result in enumerate(results[:5]):  # Check first 5 results    
                            try:    
                                # Get result text    
                                result_text = result.text.lower()    
                                logger.debug(f"Result {i+1}: {result_text[:100]}...")    
                                    
                                # Check if year matches    
                                if str(release_year) in result_text:    
                                    # Find the link - try multiple approaches    
                                    link_element = None    
                                        
                                    # Try to find link within result    
                                    try:    
                                        link_element = result.find_element(By.CSS_SELECTOR, "a[href*='/title/tt']")    
                                    except:    
                                        try:    
                                            link_element = result.find_element(By.TAG_NAME, "a")    
                                        except:    
                                            continue    
                                        
                                    if link_element:    
                                        movie_url = link_element.get_attribute("href")    
                                            
                                        # Ensure it's a proper IMDb title URL    
                                        if movie_url and "/title/tt" in movie_url:    
                                            # Clean URL (remove query parameters)    
                                            movie_url = movie_url.split('?')[0]    
                                            if not movie_url.endswith('/'):    
                                                movie_url += '/'    
                                                
                                            logger.info(f"Found IMDb URL for {title}: {movie_url}")    
                                            return movie_url    
                                                
                            except Exception as e:    
                                logger.debug(f"Error processing result {i+1}: {e}")    
                                continue    
                            
                        break  # If we found results with this selector, don't try others    
                            
                except Exception as e:    
                    logger.debug(f"Selector {selector} failed: {e}")    
                    continue    
                
            return None    
                
        except Exception as e:    
            logger.error(f"Strategy 1 failed for {title}: {e}")    
            return None    
        
    def _search_strategy_2(self, title, release_year):    
        """Strategy 2: Year-first search approach"""    
        try:    
            # Search with year first    
            search_query = f"{release_year} {title}"    
            encoded_query = quote_plus(search_query)    
            search_url = f"https://www.imdb.com/find/?q={encoded_query}&s=tt"    
                
            self.driver.get(search_url)    
            time.sleep(random.uniform(2, 4))    
                
            # Similar logic as strategy 1 but with different query format    
            try:    
                WebDriverWait(self.driver, 10).until(    
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".ipc-metadata-list-summary-item, .findResult"))    
                )    
                    
                results = self.driver.find_elements(By.CSS_SELECTOR, ".ipc-metadata-list-summary-item, .findResult")    
                    
                for result in results[:3]:  # Check first 3 results    
                    try:    
                        result_text = result.text.lower()    
                        if str(release_year) in result_text:    
                            link = result.find_element(By.CSS_SELECTOR, "a[href*='/title/tt']")    
                            movie_url = link.get_attribute("href").split('?')[0]    
                            if not movie_url.endswith('/'):    
                                movie_url += '/'    
                            return movie_url    
                    except:    
                        continue    
                            
            except TimeoutException:    
                pass    
                
            return None    
                
        except Exception as e:    
            logger.error(f"Strategy 2 failed for {title}: {e}")    
            return None    
        
    def scrape_movie_awards(self, movie_url):    
        """Enhanced awards scraping with better selectors"""    
        try:    
            # Go to awards page directly    
            if movie_url.endswith('/'):    
                awards_url = movie_url + "awards/"    
            else:    
                awards_url = movie_url + "/awards/"    
                
            logger.info(f"Accessing awards page: {awards_url}")    
            self.driver.get(awards_url)    
            time.sleep(random.uniform(3, 5))    
                
            awards_data = []    
                
            # Enhanced selectors for awards page    
            award_selectors = [    
                ".event",  # Main event containers    
                ".awards-event",    
                ".titleAwardsSection",    
                "[data-testid='awards-section']",    
                ".ipc-metadata-list-summary-item"    
            ]    
                
            for selector in award_selectors:    
                try:    
                    award_sections = self.driver.find_elements(By.CSS_SELECTOR, selector)    
                    logger.info(f"Found {len(award_sections)} award sections with selector: {selector}")    
                        
                    for section in award_sections:    
                        try:    
                            section_text = section.text.strip()    
                            if section_text and len(section_text) > 20:  # Minimum length filter    
                                # Look for winning indicators    
                                if any(indicator in section_text.lower() for indicator in     
                                      ['winner', 'won', 'awarded', 'recipient']):    
                                    awards_data.append(section_text)    
                        except:    
                            continue    
                        
                    if awards_data:    
                        break  # If we found awards, don't try other selectors    
                            
                except Exception as e:    
                    logger.debug(f"Selector {selector} failed: {e}")    
                    continue    
                
            # If no awards found, try the main movie page    
            if not awards_data:    
                logger.info("No awards found on awards page, trying main movie page")    
                self.driver.get(movie_url)    
                time.sleep(3)    
                    
                # Look for awards mentions on main page    
                try:    
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text    
                    if any(award in page_text.lower() for award in ['oscar', 'academy award', 'golden globe']):    
                        # Found award mentions, but this is basic - you might want to enhance this    
                        awards_data.append(f"Awards mentioned on main page for movie")    
                except:    
                    pass    
                
            logger.info(f"Found {len(awards_data)} award entries")    
            return awards_data    
                
        except Exception as e:    
            logger.error(f"Error scraping awards for {movie_url}: {e}")    
            return []    
        
    def parse_award_info(self, award_text, movie_id, release_year):
        """Parse award text and extract relevant information - ENHANCED VERSION"""
        awards_found = []
    
        try:
            # Normalize text
            text_lower = award_text.lower()
        
            # Check if it's one of our target awards
            award_name = None
            for target, keywords in self.target_awards.items():
                if any(keyword.lower() in text_lower for keyword in keywords):
                    award_name = target
                    break
        
                if not award_name:
                    return awards_found
        
            # Extract year (prefer release year, but look for other years in text)
            year_matches = re.findall(r'\b(19|20)\d{2}\b', award_text)
            if year_matches:
            # Use the year closest to release year
                years = [int(y) for y in year_matches]
                award_year = min(years, key=lambda x: abs(x - release_year))
            else:
                award_year = release_year
        
            # Enhanced category and person extraction
            category = self.extract_category(award_text)
            person_name = self.extract_person_name(award_text)
        
            # Determine award type based on category and content
            category_lower = category.lower() if category else ""
            text_search = f"{category_lower} {text_lower}"
        
            # Check for movie awards (including Best Picture variations)
            if any(cat in text_search for cat in self.movie_categories):
                awards_found.append({
                    'type': 'movie',
                    'award_name': award_name,
                    'year': award_year,
                    'category': category,
                    'movie_id': movie_id
                })
        
            # Check for director awards
            if any(cat in text_search for cat in self.director_categories):
                awards_found.append({
                    'type': 'director',
                    'award_name': award_name,
                    'year': award_year,
                    'category': category,
                    'movie_id': movie_id,
                    'person_name': person_name
                })
        
            # Check for actor awards
            if any(cat in text_search for cat in self.actor_categories):
                awards_found.append({
                    'type': 'actor',
                    'award_name': award_name,
                    'year': award_year,
                    'category': category,
                    'movie_id': movie_id,
                    'person_name': person_name
                })
        
            # If no specific type found but we have person name, try to infer
            if not awards_found and person_name:
            # Look for director indicators
                if any(word in text_lower for word in ['director', 'directing', 'direction']):
                    awards_found.append({
                        'type': 'director',
                        'award_name': award_name,
                        'year': award_year,
                        'category': category,
                        'movie_id': movie_id,
                        'person_name': person_name
                    })
            # Look for actor indicators
                elif any(word in text_lower for word in ['actor', 'actress', 'performance', 'leading', 'supporting']):
                    awards_found.append({
                        'type': 'actor',
                        'award_name': award_name,
                        'year': award_year,
                        'category': category,
                        'movie_id': movie_id,
                        'person_name': person_name
                    })
        
            # If still no awards found but we have a valid category, assume it's a movie award
            if not awards_found and category and category != "Unknown Category":
                awards_found.append({
                    'type': 'movie',
                    'award_name': award_name,
                    'year': award_year,
                    'category': category,
                    'movie_id': movie_id
                })
        
        except Exception as e:
            logger.error(f"Error parsing award info: {e}")
            return []
    
        return awards_found    
        
    def extract_category(self, text):
        """Extract category from award text - FIXED VERSION"""
        try:
            # Clean the text first
            text = text.strip()
        
            # Look for category in parentheses or brackets - FIXED REGEX
            category_match = re.search(r'\((.*?)\)|\[(.*?)\]', text)
            if category_match:
                category = category_match.group(1) or category_match.group(2)
                return category.strip()
        
            # Look for "for" keyword
            for_match = re.search(r'\bfor\s+(.+?)(?:\s+in\s|\s+\(|\s+\[|\n|$)', text, re.IGNORECASE)
            if for_match:
                return for_match.group(1).strip()
        
            # Look for category after award name and year
            lines = [line.strip() for line in text.split('\n') if line.strip()]
        
            # Skip first line if it contains award name and year
            start_idx = 0
            if lines and any(keyword in lines[0].lower() for keyword in ['academy', 'oscar', 'golden globe', 'winner', 'won']):
                start_idx = 1
        
            # Find the category line
            for i in range(start_idx, len(lines)):
                line = lines[i]
                # Skip lines with winning/nomination indicators
                if any(word in line.lower() for word in ['winner', 'nominated', 'won', 'year', 'ceremony']):
                    continue
            
                # If line looks like a category (not a person name)
                if line and not self._looks_like_person_name(line):
                    return line[:100]  # Limit length
        
            # Look for common category patterns
            category_patterns = [
                r'best\s+[\w\s]+',
                r'outstanding\s+[\w\s]+',
                r'achievement\s+in\s+[\w\s]+',
                r'motion\s+picture\s+[\w\s]*'
            ]
        
            for pattern in category_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group().strip()
        
        # Fallback: return first meaningful line
            if lines:
                return lines[0][:100]
        
            return "Unknown Category"
        
        except Exception as e:
            logger.error(f"Error extracting category: {e}")
            return "Unknown Category"    
        
    def _looks_like_person_name(self, text):
        """Helper to determine if text looks like a person name"""
        # Simple heuristic: if it has 2-4 words, all capitalized, likely a name
        words = text.split()
        if 2 <= len(words) <= 4:
            return all(word[0].isupper() for word in words if word)
        return False

    def extract_person_name(self, text):
        """Extract person name from award text - FIXED VERSION"""
        try:
            # Split text into lines
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            # Look for lines that might contain person names
            for line in lines:
                # Skip lines with common award keywords
                if any(word in line.lower() for word in ['winner', 'nominated', 'won', 'year', 'category', 'academy', 'award', 'best']):
                    continue
                
                # Enhanced name patterns
                name_patterns = [
                    r'\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',  # First Last or First Middle Last
                    r'\b([A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+)\b',  # First M. Last
                    r'\b([A-Z][a-z]+(?:\s+[a-z]+)?\s+[A-Z][a-z]+)\b'  # First de/van/etc Last
                ]
                
                for pattern in name_patterns:
                    matches = re.findall(pattern, line)
                    for match in matches:
                        potential_name = match.strip()
                        # Validation: name should be 5-50 characters with at least one space
                        if 5 <= len(potential_name) <= 50 and ' ' in potential_name:
                            # Additional validation: not common non-name phrases
                            if not any(phrase in potential_name.lower() for phrase in 
                                     ['motion picture', 'best picture', 'academy award', 'golden globe']):
                                return potential_name
            
            # If no name found in clean lines, try extracting from the full text
            full_text = ' '.join(lines)
            name_pattern = r'\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b'
            matches = re.findall(name_pattern, full_text)
            
            for match in matches:
                if 5 <= len(match) <= 50:
                    # Skip if it contains award-related words
                    if not any(word in match.lower() for word in ['award', 'picture', 'motion', 'academy']):
                        return match
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting person name: {e}")
            return None   
        
    def get_or_create_award(self, award_name, year):
        """Get existing award or create new one - FIXED VERSION"""
        cursor = self.conn.cursor()
  
        try:
            # Validate inputs
            if not award_name or not year:
                logger.error(f"Invalid award data: name='{award_name}', year='{year}'")
                return None
          
            # Check if award exists
            cursor.execute('SELECT award_id FROM "Award" WHERE name = %s AND year = %s', (award_name, year))
            result = cursor.fetchone()
          
            if result:
                award_id = result[0]
                logger.debug(f"Found existing award: {award_name} ({year}) with ID {award_id}")
            else:
                # Get the next available award_id
                cursor.execute('SELECT COALESCE(MAX(award_id), 0) + 1 FROM "Award"')
                next_id = cursor.fetchone()[0]
            
                # Create new award with explicit ID
                try:
                    cursor.execute(
                        'INSERT INTO "Award" (award_id, name, year) VALUES (%s, %s, %s) RETURNING award_id',
                        (next_id, award_name, year)
                    )
                    result = cursor.fetchone()
                  
                    if result:
                        award_id = result[0]
                        self.conn.commit()
                        logger.info(f"Created new award: {award_name} ({year}) with ID {award_id}")
                    else:
                        logger.error(f"INSERT returned no result for: {award_name} ({year})")
                        return None
                      
                except psycopg2.IntegrityError as e:
                    logger.error(f"Integrity error creating award {award_name} ({year}): {e}")
                    self.conn.rollback()
                
                    # Try to get the award again in case it was created by another process
                    cursor.execute('SELECT award_id FROM "Award" WHERE name = %s AND year = %s', (award_name, year))
                    result = cursor.fetchone()
                    if result:
                        award_id = result[0]
                        logger.info(f"Found award created by another process: {award_name} ({year}) with ID {award_id}")
                    else:
                        return None
                    
                except Exception as e:
                    logger.error(f"Unexpected error creating award {award_name} ({year}): {e}")
                    self.conn.rollback()
                    return None
          
            return award_id
          
        except Exception as e:
            logger.error(f"Error in get_or_create_award for {award_name} ({year}): {e}")
            self.conn.rollback()
            return None
        finally:
            cursor.close() 
        
    def find_person_in_db(self, name, movie_id, person_type):
        """Find person in database by name and movie association - ENHANCED VERSION"""
        if not name:
            return None
    
        cursor = self.conn.cursor()
    
        try:
        # Clean and parse name
            name_parts = name.strip().split()
            if len(name_parts) < 2:
                return None
        
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:])
        
        # Try exact match first
            if person_type == 'director':
                cursor.execute("""
                    SELECT d.director_id, p.person_id 
                    FROM "Director" d
                    JOIN "Person" p ON d.person_id = p.person_id
                    JOIN "Movie_Director" md ON d.director_id = md.director_id
                    WHERE md.movie_id = %s 
                    AND LOWER(p.first_name) = LOWER(%s) 
                    AND LOWER(p.last_name) = LOWER(%s)
                """, (movie_id, first_name, last_name))
        
                result = cursor.fetchone()
                if result:
                    return result
        
                # Try partial match
                cursor.execute("""
                    SELECT d.director_id, p.person_id 
                    FROM "Director" d
                    JOIN "Person" p ON d.person_id = p.person_id
                    JOIN "Movie_Director" md ON d.director_id = md.director_id
                    WHERE md.movie_id = %s 
                    AND (LOWER(p.first_name) LIKE LOWER(%s) OR LOWER(p.last_name) LIKE LOWER(%s))
                """, (movie_id, f"%{first_name}%", f"%{last_name}%"))
        
            elif person_type == 'actor':
                cursor.execute("""
                    SELECT a.actor_id, p.person_id 
                    FROM "Actor" a
                    JOIN "Person" p ON a.person_id = p.person_id
                JOIN "Role" r ON a.actor_id = r.actor_id
                WHERE r.movie_id = %s 
                AND LOWER(p.first_name) = LOWER(%s) 
                AND LOWER(p.last_name) = LOWER(%s)
            """, (movie_id, first_name, last_name))
        
            result = cursor.fetchone()
            if result:
                return result
        
        # Try partial match
            cursor.execute("""
                SELECT a.actor_id, p.person_id 
                FROM "Actor" a
                JOIN "Person" p ON a.person_id = p.person_id
                JOIN "Role" r ON a.actor_id = r.actor_id
                WHERE r.movie_id = %s 
                AND (LOWER(p.first_name) LIKE LOWER(%s) OR LOWER(p.last_name) LIKE LOWER(%s))
            """, (movie_id, f"%{first_name}%", f"%{last_name}%"))
        
            result = cursor.fetchone()
            return result
        
        except Exception as e:
            logger.error(f"Error finding person {name}: {e}")
            return None
        finally:
            cursor.close()
        
    def save_award_data(self, award_data):    
        """Save parsed award data to database"""    
        cursor = self.conn.cursor()    
            
        try:    
            award_id = self.get_or_create_award(award_data['award_name'], award_data['year'])    
            if not award_id:    
                logger.error(f"Could not create/get award ID for {award_data['award_name']}")    
                return False    
                
            if award_data['type'] == 'movie':    
                # Insert into Award_Movie    
                cursor.execute("""    
                    INSERT INTO "Award_Movie" (award_id, movie_id, category)     
                    VALUES (%s, %s, %s)    
                    ON CONFLICT DO NOTHING    
                """, (award_id, award_data['movie_id'], award_data['category']))    
                    
            elif award_data['type'] == 'director':    
                # Find director    
                person_data = self.find_person_in_db(award_data['person_name'], award_data['movie_id'], 'director')    
                if person_data:    
                    director_id = person_data[0]    
                    cursor.execute("""    
                        INSERT INTO "Award_Director" (award_id, director_id, movie_id, category)    
                        VALUES (%s, %s, %s, %s)    
                        ON CONFLICT DO NOTHING    
                    """, (award_id, director_id, award_data['movie_id'], award_data['category']))    
                else:    
                    logger.warning(f"Could not find director {award_data['person_name']} for movie {award_data['movie_id']}")    
                    return False    
                    
            elif award_data['type'] == 'actor':    
                # Find actor    
                person_data = self.find_person_in_db(award_data['person_name'], award_data['movie_id'], 'actor')    
                if person_data:    
                    actor_id = person_data[0]    
                    cursor.execute("""    
                        INSERT INTO "Award_Actor" (award_id, actor_id, movie_id, category)    
                        VALUES (%s, %s, %s, %s)    
                        ON CONFLICT DO NOTHING    
                    """, (award_id, actor_id, award_data['movie_id'], award_data['category']))    
                else:    
                    logger.warning(f"Could not find actor {award_data['person_name']} for movie {award_data['movie_id']}")    
                    return False    
                
            self.conn.commit()    
            logger.info(f"Saved award data: {award_data['award_name']} ({award_data['type']}) for movie {award_data['movie_id']}")    
            return True    
                
        except Exception as e:    
            logger.error(f"Error saving award data: {e}")    
            self.conn.rollback()    
            return False    
        finally:    
            cursor.close()    
        
    def run_scraper(self):    
        """Enhanced main function with better error handling"""    
        try:    
            # Setup    
            self.connect_db()    
            self.setup_driver()    
                
            # Get movies from database    
            movies = self.get_movies_from_db()    
            logger.info(f"Found {len(movies)} movies to process")    
                
            processed_count = 0    
            successful_count = 0    
                
            for movie_id, title, release_date in movies:    
                try:    
                    release_year = release_date.year if release_date else None    
                    if not release_year:    
                        logger.warning(f"No release year for movie {title}, skipping")    
                        continue    
                        
                    logger.info(f"Processing movie {processed_count + 1}/{len(movies)}: {title} ({release_year})")    
                        
                    # Search for movie on IMDb    
                    movie_url = self.search_movie_on_imdb(title, release_year)    
                    if not movie_url:    
                        logger.warning(f"Could not find IMDb page for {title}")    
                        processed_count += 1    
                        continue    
                        
                    # Scrape awards    
                    awards_data = self.scrape_movie_awards(movie_url)    
                    if not awards_data:    
                        logger.info(f"No awards found for {title}")    
                        processed_count += 1    
                        continue    
                        
                    # Parse and save award data    
                    awards_saved = 0    
                    for award_text in awards_data:    
                        try:    
                            parsed_awards = self.parse_award_info(award_text, movie_id, release_year)    
                            if parsed_awards:  # Check if list is not empty    
                                for award_data in parsed_awards:    
                                    try:    
                                        if self.save_award_data(award_data):    
                                            awards_saved += 1    
                                    except Exception as e:    
                                        logger.error(f"Error saving individual award: {e}")    
                        except Exception as e:    
                            logger.error(f"Error parsing award text: {e}")    
                            continue    
                        
                    logger.info(f"Saved {awards_saved} awards for {title}")    
                    successful_count += 1    
                    processed_count += 1    
                        
                    # Random delay between movies    
                    time.sleep(random.uniform(5, 8))    
                        
                except Exception as e:    
                    logger.error(f"Error processing movie {title}: {e}")    
                    processed_count += 1    
                    continue    
                
            logger.info(f"Completed processing {processed_count} movies, {successful_count} successful")    
                
        except Exception as e:    
            logger.error(f"Fatal error in scraper: {e}")    
            
        finally:    
            # Cleanup    
            if self.driver:    
                self.driver.quit()    
            if self.conn:    
                self.conn.close()    
    
def main():    
    # Database configuration    
    DB_CONFIG = {    
        'dbname': 'AMDB',    
        'user': 'postgres',    
        'password': 'ashfaq',    
        'host': 'localhost',    
        'port': '5432'    
    }    
        
    # Initialize and run scraper    
    scraper = IMDbAwardScraper(DB_CONFIG)    
    scraper.run_scraper()    
    
if __name__ == "__main__":    
    main()    