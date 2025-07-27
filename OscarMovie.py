import requests  
import csv  
import time  
import re  
from datetime import datetime  
  
class AdvancedOscarSearcher:  
    def __init__(self, api_key, search_engine_id):  
        self.api_key = api_key  
        self.search_engine_id = search_engine_id  
        self.base_url = "https://www.googleapis.com/customsearch/v1"  
          
        # Known Oscar ceremony years mapping  
        self.ceremony_year_mapping = {  
            year: year + 1 for year in range(1980, 2025)  # 1980 ceremony for 1981 awards, etc.  
        }  
      
    def create_targeted_queries(self, year, category):  
        """  
        Create multiple targeted search queries for better results  
        """  
        queries = [  
            f"Oscar {year} {category} winner",  
            f"Academy Awards {year} {category} winner",  
            f'"{category}" Oscar {year} winner',  
            f"{year} Oscars {category} Academy Awards winner",  
            f"Academy Awards {year} Best Picture winner" if category == "Best Picture" else f"Academy Awards {year} {category}"  
        ]  
        return queries  
      
    def google_custom_search(self, query, num_results=5):  
        """  
        Search Google using Custom Search API with error handling  
        """  
        params = {  
            'key': self.api_key,  
            'cx': self.search_engine_id,  
            'q': query,  
            'num': min(num_results, 10)  
        }  
          
        try:  
            response = requests.get(self.base_url, params=params)  
            response.raise_for_status()  
            return response.json()  
        except requests.exceptions.RequestException as e:  
            print(f"API Error for '{query}': {e}")  
            return {}  
      
    def extract_movie_info_advanced(self, search_results, year, category):  
        """  
        Advanced extraction of movie information  
        """  
        results = []  
          
        if 'items' not in search_results:  
            return results  
          
        for item in search_results['items']:  
            title = item.get('title', '')  
            snippet = item.get('snippet', '')  
              
            # Combine title and snippet for analysis  
            full_text = f"{title} {snippet}"  
              
            # Extract movie names using multiple methods  
            movies = self.extract_movie_names(full_text, category)  
              
            for movie in movies:  
                release_date = self.find_release_date(full_text, movie, year)  
                  
                result = {  
                    'AwardName': 'Academy Awards (Oscars)',  
                    'Year': year,  
                    'Category': category,  
                    'MovieName': movie,  
                    'ReleaseDate': release_date  
                }  
                results.append(result)  
          
        return results  
      
    def extract_movie_names(self, text, category):  
        """  
        Extract movie names using various patterns  
        """  
        movies = set()  
          
        # Clean the text  
        text = re.sub(r'[^\w\s\-\'":]', ' ', text)  
          
        # Patterns for different contexts  
        patterns = [  
            r'winner[:\s]+([A-Z][^,\n\r\.]+)',  
            r'won[:\s]+([A-Z][^,\n\r\.]+)',  
            r'award.*?to[:\s]+([A-Z][^,\n\r\.]+)',  
            r'([A-Z][^,\n\r\.]+)\s+won',  
            r'([A-Z][^,\n\r\.]+)\s+wins',  
            r'([A-Z][^,\n\r\.]+)\s+takes',  
            r'best\s+picture[:\s]+([A-Z][^,\n\r\.]+)' if category == "Best Picture" else r'',  
        ]  
          
        for pattern in patterns:  
            if pattern:  # Skip empty patterns  
                matches = re.findall(pattern, text, re.IGNORECASE)  
                for match in matches:  
                    movie = self.clean_movie_name(match.strip())  
                    if self.is_valid_movie_name(movie):  
                        movies.add(movie)  
          
        return list(movies)  
      
    def clean_movie_name(self, movie_name):  
        """  
        Clean and format movie name  
        """  
        # Remove common non-movie words  
        stop_words = ['oscar', 'academy', 'award', 'awards', 'winner', 'wins', 'won', 'ceremony', 'best']  
          
        words = movie_name.split()  
        cleaned_words = [word for word in words if word.lower() not in stop_words]  
          
        return ' '.join(cleaned_words).strip()  
      
    def is_valid_movie_name(self, movie_name):  
        """  
        Validate if the extracted text is likely a movie name  
        """  
        if len(movie_name) < 2:  
            return False  
          
        # Check if it's not just numbers or common words  
        if movie_name.isdigit():  
            return False  
              
        invalid_words = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with']  
        if movie_name.lower() in invalid_words:  
            return False  
              
        return True  
      
    def find_release_date(self, text, movie_name, oscar_year):  
        """  
        Find release date for the movie  
        """  
        # Look for years in the text  
        year_pattern = r'\b(19\d{2}|20\d{2})\b'  
        years = re.findall(year_pattern, text)  
          
        # Filter years that make sense for Oscar eligibility  
        valid_years = [year for year in years if int(year) <= oscar_year and int(year) >= oscar_year - 2]  
          
        if valid_years:  
            return valid_years[0]  
          
        # Default to year before Oscar ceremony  
        return str(oscar_year - 1)  
      
    def search_all_oscar_data(self):  
        """  
        Search for all Oscar data with progress tracking  
        """  
        categories = [  
            "Best Picture",  
            "Best Animated Feature",  
            "Best Sound",  
            "Best Cinematography",  
            "Best Visual Effects",  
            "Best Adapted Screenplay",  
            "Best Original Screenplay"  
        ]  
          
        years = list(range(1981, 2026))  
        all_results = []  
          
        total_operations = len(years) * len(categories)  
        current_operation = 0  
          
        print(f"Starting search for {total_operations} year-category combinations...")  
          
        for year in years:  
            for category in categories:  
                current_operation += 1  
                progress = (current_operation / total_operations) * 100  
                  
                print(f"Progress: {progress:.1f}% - Searching {category} for {year}")  
                  
                # Create multiple queries for this year-category combination  
                queries = self.create_targeted_queries(year, category)  
                  
                category_results = []  
                for query in queries[:2]:  # Limit to 2 queries per category to save API calls  
                    search_results = self.google_custom_search(query)  
                    movie_data = self.extract_movie_info_advanced(search_results, year, category)  
                    category_results.extend(movie_data)  
                      
                    time.sleep(0.5)  # Rate limiting  
                  
                all_results.extend(category_results)  
          
        return all_results  
      
    def save_to_csv(self, results, filename=None):  
        """  
        Save results to CSV with deduplication  
        """  
        if not filename:  
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")  
            filename = f'oscar_winners_{timestamp}.csv'  
          
        if not results:  
            print("No results to save")  
            return filename  
          
        # Remove duplicates based on Year, Category, and MovieName  
        unique_results = []  
        seen_combinations = set()  
          
        for result in results:  
            key = (result['Year'], result['Category'], result['MovieName'].lower().strip())  
            if key not in seen_combinations:  
                unique_results.append(result)  
                seen_combinations.add(key)  
          
        # Sort results  
        unique_results.sort(key=lambda x: (x['Year'], x['Category'], x['MovieName']))  
          
        # Write to CSV  
        fieldnames = ['AwardName', 'Year', 'Category', 'MovieName', 'ReleaseDate']  
          
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:  
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)  
            writer.writeheader()  
            writer.writerows(unique_results)  
          
        print(f"\n✅ Successfully saved {len(unique_results)} unique results to {filename}")  
          
        # Print summary  
        self.print_summary(unique_results)  
          
        return filename  
      
    def print_summary(self, results):  
        """  
        Print a summary of the results  
        """  
        print("\n📊 SUMMARY:")  
        print(f"Total unique entries: {len(results)}")  
          
        # Count by category  
        category_counts = {}  
        for result in results:  
            category = result['Category']  
            category_counts[category] = category_counts.get(category, 0) + 1  
          
        print("\nResults by category:")  
        for category, count in sorted(category_counts.items()):  
            print(f"  {category}: {count} entries")  
  
def main():  
    """  
    Main execution function  
    """  
    # Your API credentials  
    API_KEY = "AIzaSyDFnlw5JmOyLAMKLsb1E3UKNlTp69mZl0g"  
    SEARCH_ENGINE_ID = "151b8171b68174260"  
      
    # Initialize the searcher  
    searcher = AdvancedOscarSearcher(API_KEY, SEARCH_ENGINE_ID)  
      
    print("🎬 Oscar Awards Data Collector (1981-2025)")  
    print("=" * 50)  
      
    # Start the search  
    start_time = time.time()  
    results = searcher.search_all_oscar_data()  
      
    # Save results  
    filename = searcher.save_to_csv(results)  
      
    # Calculate execution time  
    end_time = time.time()  
    execution_time = end_time - start_time  
      
    print(f"\n⏱️  Total execution time: {execution_time:.2f} seconds")  
    print(f"📁 Results saved to: {filename}")  
  
if __name__ == "__main__":  
    main()  