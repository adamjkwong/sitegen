# SiteGen

One-shot website generation & instant publishing to GitHub Pages. SiteGen takes a 1-3 sentence description and uses either Google's Gemini Cloud or a local Gemma model to generate a fully responsive, static website that is instantly pushed to GitHub and hosted.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/adamjkwong/sitegen.git
cd sitegen
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Model Setup

### Option A: Gemini Cloud (Recommended)
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add it to your `.env.local` as shown above.

### Option B: Local Gemma (On-Device)
To run models locally without an API key, SiteGen uses **Ollama**.
1. **Install Ollama**: Download and install from [ollama.com](https://ollama.com/).
2. **Download Gemma 4**: Open your terminal and run:
   ```bash
   ollama pull gemma4:e4b
   ```
3. **Keep Ollama Running**: Ensure the Ollama application is active while using SiteGen.
4. **Select "Local Gemma"**: Toggle the provider on the SiteGen dashboard.

---

## 🖥️ How to Use
1. **Enter a Prompt**: e.g., "A minimalist dark-themed portfolio for a creative director."
2. **Choose Provider**: Select between Cloud (Gemini) or Local (Gemma).
3. **Generate & Publish**: Click the button. SiteGen will:
   - Generate the `index.html`.
   - Create a date-stamped folder in `generated-sites/`.
   - Commit and Push to your GitHub repository.
4. **View Live**: Click the "Visit Site" button that appears to see your site hosted on GitHub Pages.

---

## 🔒 Security & Static Policy
- **Static Only**: SiteGen strictly forbids `<form>`, `<input>`, or any data-entry elements.
- **No Data Collection**: No generated site will include logic to collect user data or communicate with external APIs.
- **Relative Paths**: All assets and links are relative, ensuring compatibility with GitHub Pages subfolder hosting.

## 🛠 Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **LLM**: Google Gemini SDK (@google/generative-ai) / Ollama API
- **Automation**: Node.js `child_process` for Git/GitHub CLI integration
