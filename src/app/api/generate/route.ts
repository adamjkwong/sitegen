import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
  You are an expert web developer. Generate a single-file, high-quality, modern, responsive static website.
  
  RULES:
  1. OUTPUT ONLY RAW HTML. DO NOT include any markdown backticks (e.g., \`\`\`html) or conversational text.
  2. START IMMEDIATELY with <!DOCTYPE html>.
  3. END with </html>.
  4. NO INTERACTIVITY: No <form>, <input>, <textarea>, or <button> (unless for internal navigation).
  5. TAILWIND ONLY: Use <script src="https://cdn.tailwindcss.com"></script> for styling. Do not use external CSS files.
  6. ALL-IN-ONE: Include all CSS and JS (if any) inside the single HTML file.
  7. ASSETS: Use placeholder images (e.g., from Unsplash) and relative links for internal navigation.
  8. NO EXPLANATIONS: Do not say "Sure," "Here is," or any other text before or after the code.
`;

export async function POST(req: Request) {
  try {
    const { prompt, provider } = await req.json();
    let html = '';

    if (provider === 'gemma-local') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for local model

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma4:e4b',
            prompt: `[INST] ${SYSTEM_PROMPT}\n\nUser description: ${prompt} [/INST]`,
            stream: false,
            options: {
              temperature: 0.2, // Lower temperature for more consistent code output
              num_predict: 4096, // Ensure enough tokens for a full website
            }
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
          : 'Local model failed: Make sure Ollama is running and you have run "ollama pull gemma4:e4b"';
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

    // Robust extraction: Find the first <html> and last </html> if present, 
    // or just strip markdown if the model ignored the "raw" instruction.
    const htmlStart = html.toLowerCase().indexOf('<!doctype');
    const htmlEnd = html.toLowerCase().lastIndexOf('</html>');

    if (htmlStart !== -1 && htmlEnd !== -1 && htmlEnd > htmlStart) {
      html = html.substring(htmlStart, htmlEnd + 7);
    } else {
      // Fallback: strip markdown wrappers
      const match = html.match(/```(?:html)?\n?([\s\S]*?)```/);
      if (match && match[1]) {
        html = match[1].trim();
      } else {
        html = html.replace(/^```html\n/, '').replace(/\n```$/, '').trim();
      }
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
