import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt, provider } = await req.json();

    if (provider === 'gemma-local') {
      // Placeholder for local Gemma integration
      // In a real scenario, this would call a local Ollama endpoint
      return NextResponse.json(
        { error: 'Local Gemma integration is not yet implemented. Please use Gemini Cloud.' },
        { status: 501 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `
      You are an expert web developer. Your task is to generate a high-quality, modern, and visually appealing website based on the user's description.
      
      CRITICAL REQUIREMENTS:
      1. Output ONLY the source code for a single "index.html" file.
      2. The file must include ALL necessary CSS and JavaScript (internal scripts and styles).
      3. Use modern, responsive design principles.
      4. You may use the Tailwind CSS CDN for styling: <script src="https://cdn.tailwindcss.com"></script>
      5. Include a clear structure: Header, Main Content sections, and a Footer.
      6. Ensure the design is polished with good typography, spacing, and color palettes.
      7. DO NOT include any markdown formatting (like \`\`\`html) in your response. Just the raw HTML code.
      8. The website should feel complete and ready to host.
    `;

    const result = await model.generateContent([systemPrompt, `User description: ${prompt}`]);
    const response = await result.response;
    let html = response.text().trim();

    // Clean up markdown code blocks if the model ignored instructions
    html = html.replace(/^```html\n/, '').replace(/\n```$/, '');

    // Generate a simple slug from the prompt
    const slug = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 30) || 'awesome-site';

    return NextResponse.json({ html, slug });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate website content' }, { status: 500 });
  }
}
