import os
import requests
from bs4 import BeautifulSoup
import anthropic

def scrape_patent_sites(query):
    # Example: Scrape Google Patents
    search_url = f"https://patents.google.com/?q={query.replace(' ', '+')}"
    resp = requests.get(search_url, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")
    # Extract some relevant patent titles/links (simplified)
    results = []
    for result in soup.select("article h3 a")[:3]:  # Top 3 results
        title = result.text.strip()
        link = "https://patents.google.com" + result['href']
        results.append({"title": title, "link": link})
    return results

def generate_regulatory_report(user_input):
    # 1. Scrape patent sites
    patents = scrape_patent_sites(user_input['molecule_name'])

    # 2. Prepare prompt for Claude
    prompt = (
        f"Given the following molecule and context:\n"
        f"Molecule: {user_input['molecule_name']}\n"
        f"Indication: {user_input.get('indication', 'N/A')}\n"
        f"Mechanism: {user_input.get('mechanism', 'N/A')}\n"
        f"Here are some related patents:\n"
    )
    for p in patents:
        prompt += f"- {p['title']} ({p['link']})\n"
    prompt += (
        "\nBased on this information, provide a regulatory pathway prediction, "
        "including any special advantages, challenges, and relevant patent considerations."
    )

    # 3. Call Claude
    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    except Exception as e:
        # Log the error and return a user-friendly message
        print(f"Error calling Claude API: {e}")
        return "Error generating regulatory analysis. Please check API credentials and model access." 