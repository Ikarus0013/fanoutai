# FanoutAI

FanoutAI is a web app that tries to show the web search queries an OpenAI model uses for a prompt, and makes SEO prompts from a website.

## What it does

The app has two modes. In prompt mode, you enter a prompt. The backend sends the prompt to an OpenAI model and looks for the search queries the model used. In URL mode, you enter a website URL. The backend reads the text of the page and asks the model for 20 questions that users can ask about it. You can click a question to examine it in prompt mode. You can copy the results.

## Requirements

- Node.js 18 or later.
- npm (included with Node.js).
- Python 3.9 or later, with `pip`.
- An OpenAI account and API key: <https://platform.openai.com/api-keys>. Your account must have access to the model `gpt-5`.

## Install

1. Get the code:

   ```bash
   git clone https://github.com/Ikarus0013/fanoutai.git
   ```

2. Go into the project folder:

   ```bash
   cd fanoutai
   ```

3. Make a Python virtual environment:

   ```bash
   python3 -m venv venv
   ```

4. Activate the virtual environment:

   ```bash
   source venv/bin/activate
   ```

5. Install the Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

6. Install the Node.js dependencies:

   ```bash
   npm install
   ```

7. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

8. Write your OpenAI API key into the `.env` file. Refer to "Configure".

## Configure

Put this value in the `.env` file in the project root.

| Variable | Required | Description | Where to get it |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI API key. Only the Python backend uses it. | <https://platform.openai.com/api-keys> |

**CAUTION:** Do not commit the `.env` file. It contains your private key.

## Use

1. Start the backend in a terminal. The backend uses port 5001.

   ```bash
   source venv/bin/activate
   python app.py
   ```

2. Start the frontend in a second terminal:

   ```bash
   npm start
   ```

3. Open <http://localhost:3000> in your browser.
4. Click "Prompt Analysis" or "URL Analysis" in the sidebar.
5. Enter a prompt, or enter a URL that starts with `http://` or `https://`.
6. Click "Analyze Prompt" or "Generate Prompts".
7. Read the results.
8. Click "Copy All" to copy all results.
9. In URL mode, click a generated question to examine it as a prompt.

The "History" and "Settings" items in the sidebar are not complete.

To make a production build of the frontend, use this command:

```bash
npm run build
```

## How it works

1. The React frontend sends the input to `http://localhost:5001/api/analyze`.
2. The Flask backend (`app.py`) checks if the input is a URL.
3. For a URL, the backend gets the page with `requests` and reads the text with BeautifulSoup. Then it asks `gpt-5` for 20 questions.
4. For a prompt, the backend sends the prompt to `gpt-5` two times (one stream and one normal request). It looks for search query data in the answers.
5. If the backend finds no search queries, it sends back a help message.

The backend also has a health check at `GET /health`.

## Files

| Path | Description |
| --- | --- |
| `app.py` | Flask backend with the OpenAI calls and the web page reader. |
| `requirements.txt` | Python dependencies. |
| `src/App.js` | React user interface. |
| `src/index.js` | React entry point. |
| `src/index.css` | Styles. |
| `public/index.html` | HTML page. |
| `vercel.json` | Settings for a Vercel deployment. |
| `.env.example` | Example environment file. |

## Limits

- The OpenAI Chat Completions API does not usually send back search queries. Thus the prompt mode often shows only the help message.
- The backend uses the old OpenAI Python interface (`openai.ChatCompletion`). For this reason, `requirements.txt` uses `openai==0.28.1`. Newer versions of the `openai` package do not work with this code.
- Each prompt analysis sends two requests to OpenAI. This increases the cost.
- The frontend always calls `http://localhost:5001`. A Vercel deployment with `vercel.json` does not work before you change this address in `src/App.js`.
- The backend starts in Flask debug mode. Do not use it on a public server.
- Some websites block the page reader.

## License

MIT. Refer to the `LICENSE` file.
