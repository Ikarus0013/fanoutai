import os
import re
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

def is_url(input_text):
    """Check if the input text is a URL"""
    url_pattern = r'^https?://'
    return bool(re.match(url_pattern, input_text.strip()))

def scrape_website_content(url):
    """Scrape content from a website URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up the text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Limit content length to avoid token limits
        return text[:8000]  # Limit to ~8000 characters
        
    except Exception as e:
        raise Exception(f"Failed to scrape website: {str(e)}")

def generate_prompts_from_url(url):
    """Generate SEO prompts from website content"""
    try:
        # Scrape website content
        content = scrape_website_content(url)
        
        # Create prompt for AI to generate questions
        system_prompt = """You are a content strategist and SEO expert. Based on the following website content, generate exactly 20 common questions that users might ask related to this content. 

Return ONLY a JSON array of strings, no additional text or explanation. Each question should be specific and relevant to the content.

Format: ["question 1", "question 2", "question 3", ...]"""

        user_prompt = f"Content: {content}"
        
        # Use GPT-5 for consistency with search query analysis
        response = openai.ChatCompletion.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_completion_tokens=1000
        )
        
        # Extract and parse JSON response
        response_text = response.choices[0].message.content.strip()
        
        # Clean up the response to extract JSON array
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        questions = json.loads(response_text)
        
        if not isinstance(questions, list) or len(questions) != 20:
            raise Exception("Invalid response format from AI model")
            
        return questions
        
    except json.JSONDecodeError:
        raise Exception("Failed to parse AI response as JSON")
    except Exception as e:
        raise Exception(f"Failed to generate prompts: {str(e)}")

def get_gpt5_queries(prompt):
    """Get real search queries from GPT-5 API by parsing streaming metadata"""
    try:
        print(f"🔍 Starting GPT-5 analysis for prompt: '{prompt}'")
        
        # Use streaming to capture search queries as they happen
        # The LinkedIn post shows queries are in streaming chunks, not final response
        response = openai.ChatCompletion.create(
            model="gpt-5",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000,
            stream=True  # We need streaming to capture search metadata
        )
        
        search_queries = []
        chunk_count = 0
        metadata_found = False
        
        print("📡 Starting to process streaming response...")
        
        # Process each streaming chunk
        for chunk in response:
            chunk_count += 1
            
            # Log chunk structure for debugging
            print(f"📦 Chunk {chunk_count}:")
            print(f"   - Has metadata: {hasattr(chunk, 'metadata')}")
            print(f"   - Has choices: {hasattr(chunk, 'choices')}")
            
            # Log the raw chunk object to see its structure
            print(f"   - Chunk type: {type(chunk)}")
            print(f"   - Chunk attributes: {[attr for attr in dir(chunk) if not attr.startswith('_')]}")
            
            # Check for any search-related attributes
            if hasattr(chunk, '__dict__'):
                print(f"   - Chunk dict: {chunk.__dict__}")
            
            if hasattr(chunk, 'metadata'):
                print(f"   - Metadata: {chunk.metadata}")
                metadata_found = True
                
                # Check if this chunk contains metadata
                if chunk.metadata:
                    metadata = chunk.metadata
                    
                    # Look for search_model_queries in this chunk's metadata
                    if 'search_model_queries' in metadata:
                        print(f"   ✅ Found search_model_queries in metadata!")
                        search_queries_data = metadata['search_model_queries']
                        print(f"   - search_model_queries data: {search_queries_data}")
                        
                        if 'queries' in search_queries_data:
                            queries = search_queries_data['queries']
                            print(f"   - queries array: {queries}")
                            
                            if queries and len(queries) > 0:
                                print(f"   ✅ Adding {len(queries)} queries: {queries}")
                                search_queries.extend(queries)
            
            # Also check the chunk content for search-related information
            if hasattr(chunk, 'choices') and chunk.choices:
                choice = chunk.choices[0]
                print(f"   - Choice structure: {type(choice)}")
                print(f"   - Choice attributes: {dir(choice)}")
                
                if hasattr(choice, 'delta'):
                    print(f"   - Delta structure: {type(choice.delta)}")
                    print(f"   - Delta attributes: {dir(choice.delta)}")
                    
                    if hasattr(choice.delta, 'content') and choice.delta.content:
                        content = choice.delta.content
                        print(f"   - Content: '{content}'")
                        
                        # Look for quoted search terms in the content
                        quoted_queries = re.findall(r'"([^"]+)"', content)
                        if quoted_queries:
                            print(f"   - Found quoted strings: {quoted_queries}")
                            
                        for query in quoted_queries:
                            if (5 <= len(query) <= 100 and 
                                any(keyword in query.lower() for keyword in ['best', 'how', 'what', 'where', 'when', 'why', 'top', 'guide', 'tips', 'review', 'comparison'])):
                                if query not in search_queries:  # Avoid duplicates
                                    print(f"   ✅ Adding search query from content: '{query}'")
                                    search_queries.append(query)
        
        print(f"📊 Processing complete:")
        print(f"   - Total chunks processed: {chunk_count}")
        print(f"   - Metadata found in chunks: {metadata_found}")
        print(f"   - Raw search queries collected: {search_queries}")
        
        # Also check if there's a final response object with search data
        # Sometimes the search metadata comes at the end
        print(f"🔍 Checking for final response object...")
        try:
            # Try to get the full response object
            full_response = openai.ChatCompletion.create(
                model="gpt-5",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=2000,
                stream=False  # Get the full response without streaming
            )
            print(f"   - Full response type: {type(full_response)}")
            print(f"   - Full response attributes: {[attr for attr in dir(full_response) if not attr.startswith('_')]}")
            
            if hasattr(full_response, 'metadata'):
                print(f"   - Full response metadata: {full_response.metadata}")
                if full_response.metadata and 'search_model_queries' in full_response.metadata:
                    print(f"   ✅ Found search queries in final response!")
                    final_queries = full_response.metadata['search_model_queries'].get('queries', [])
                    if final_queries:
                        search_queries.extend(final_queries)
                        print(f"   - Final response queries: {final_queries}")
            
            if hasattr(full_response, 'choices') and full_response.choices:
                choice = full_response.choices[0]
                if hasattr(choice, 'message') and hasattr(choice.message, 'metadata'):
                    print(f"   - Choice message metadata: {choice.message.metadata}")
                    
        except Exception as e:
            print(f"   - Error getting full response: {e}")
        
        # Remove duplicates while preserving order
        unique_queries = []
        seen = set()
        for query in search_queries:
            if query not in seen:
                unique_queries.append(query)
                seen.add(query)
        
        print(f"   - Unique queries after deduplication: {unique_queries}")
        
        if unique_queries:
            print(f"✅ Returning {len(unique_queries)} unique queries")
            return unique_queries[:10]  # Return up to 10 queries
        
        # If no search queries found, return a message indicating no search was performed
        print("❌ No search queries found - returning fallback message")
        return [
            "No search queries found - GPT-5 may not have performed web search for this prompt",
            "",
            "💡 Try prompts that require current information:",
            "• 'What are the latest developments in AI in 2024?'",
            "• 'Current stock price of Apple today'", 
            "• 'Recent news about Tesla this week'",
            "• 'What happened in the tech industry yesterday?'",
            "• 'Latest updates on OpenAI GPT-5 release'"
        ]
        
    except Exception as e:
        print(f"💥 Exception in get_gpt5_queries: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Failed to get GPT-5 search queries: {str(e)}")

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main API endpoint for analyzing prompts or URLs"""
    try:
        data = request.get_json()
        
        if not data or 'input' not in data:
            return jsonify({'error': 'Input is required'}), 400
        
        user_input = data['input'].strip()
        
        if not user_input:
            return jsonify({'error': 'Input cannot be empty'}), 400
        
        if is_url(user_input):
            # URL provided - generate prompts from website content
            try:
                generated_prompts = generate_prompts_from_url(user_input)
                return jsonify({
                    'type': 'url_analysis',
                    'url': user_input,
                    'generated_prompts': generated_prompts
                })
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        else:
            # Text prompt provided - analyze for search queries
            try:
                queries = get_gpt5_queries(user_input)
                return jsonify({
                    'type': 'prompt_analysis',
                    'prompt': user_input,
                    'queries': queries
                })
            except Exception as e:
                return jsonify({'error': str(e)}), 500
                
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
