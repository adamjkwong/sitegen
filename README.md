# SiteGen

One-shot website generation & instant publishing to GitHub Pages.

## 🔒 Security & Static Policy

This application is designed to create **strictly static, informational websites**. 

### Core Restrictions
- **No Inputs**: The generator is instructed never to include `<form>`, `<input>`, or `<textarea>` elements.
- **No Data Collection**: No generated site will include logic to collect user data or communicate with external APIs.
- **Content Security**: We use the Tailwind CSS CDN for styling, but otherwise avoid external JavaScript dependencies to minimize the attack surface.

### Security Recommendations
1. **GitHub Pages Security**: GitHub Pages serves content over HTTPS by default. Do not disable this.
2. **Content Security Policy (CSP)**: While difficult to automate for every unique site, you can manually add a CSP `<meta>` tag to the generated `index.html` if you need to strictly control allowed resources.
3. **Subresource Integrity (SRI)**: For the Tailwind CDN, consider using SRI hashes if you want to ensure the library has not been tampered with.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment**:
   Create a `.env.local` file:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. **Run Locally**:
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack
- **Frontend**: Next.js 15+, React 19, Tailwind CSS
- **LLM**: Google Gemini API / Local Gemma (via Ollama)
- **Deployment**: GitHub Pages
