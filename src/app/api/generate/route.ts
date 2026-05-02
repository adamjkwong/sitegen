import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
  You are an expert web developer. Your task is to generate a high-quality, modern, and visually appealing website based on the user's description.
  
  CRITICAL REQUIREMENTS:
  1. Output ONLY the source code for a single "index.html" file.
  2. The file must include ALL necessary CSS and JavaScript (internal scripts and styles).
  3. Use modern, responsive design principles.
  4. You may use the Tailwind CSS CDN for styling: <script src="https://cdn.tailwindcss.com"></script>
  5. Include a clear structure: Header, Main Content sections, and a Footer.
  6. Ensure the design is polished with good typography, spacing, and color palettes.
  7. DO NOT include any markdown formatting (like \`\`\`html) in your response. Just the raw HTML code.
  8. IMPORTANT: All internal links, asset paths, and image references must be RELATIVE (e.g., "./images/logo.png" or "index.html#section") to ensure they work when hosted in subfolders.
  9. The website should feel complete and ready to host.
`;

export async function POST(req: Request) {
  try {
    const { prompt, provider } = await req.json();
    let html = '';

    if (provider === 'gemma-local') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for local model

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2',
            prompt: `${SYSTEM_PROMPT}\n\nUser description: ${prompt}`,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Ollama service not responding. Make sure Ollama is running.');
        }

        const data = await response.json();
        html = data.response.trim();
      } catch (ollamaError: unknown) {
        const isAbort = ollamaError instanceof Error && ollamaError.name === 'AbortError';
        const message = isAbort
          ? 'Generation timed out. Local models can be slow; check your system resources.'
          : 'Local model failed: Make sure Ollama is running and you have run "ollama pull gemma2"';
        return NextResponse.json({ error: message }, { status: 503 });
      }
    } else {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY is not configured in .env.local' },
          { status: 500 }
        );
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([SYSTEM_PROMPT, `User description: ${prompt}`]);
      const response = await result.response;
      html = response.text().trim();
    }

    // Robust markdown stripping: Extract content between triple backticks if present
    const match = html.match(/```(?:html)?\n?([\s\S]*?)```/);
    if (match && match[1]) {
      html = match[1].trim();
    } else {
      // Fallback: strip any remaining markdown wrappers if they were only at the ends
      html = html.replace(/^```html\n/, '').replace(/\n```$/, '').trim();
    }

    // Improved Slug Sanitization
    const slug = prompt
      .toLowerCase()
      .normalize('NFD') // Handle accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) || 'site';

    return NextResponse.json({ html, slug });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate website content' }, { status: 500 });
  }
}
