'use client';

import { useState } from 'react';
import { Sparkles, Globe, Cpu, Cloud, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

type ModelProvider = 'gemini-cloud' | 'gemma-local';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('gemini-cloud');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const addStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus(prev => [...prev, { message, type }]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatus([]);
    setPublishedUrl(null);
    addStatus('Initiating generation process...', 'info');

    try {
      // Step 1: Generate Site content
      addStatus(`Calling ${provider === 'gemini-cloud' ? 'Gemini Cloud' : 'Local Gemma'}...`, 'info');
      const genResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider }),
      });

      if (!genResponse.ok) {
        const errorData = await genResponse.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const { html, slug } = await genResponse.json();
      addStatus('Website content generated successfully!', 'success');

      // Step 2: Publish to GitHub
      addStatus('Publishing to GitHub Pages...', 'info');
      const pubResponse = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, slug }),
      });

      if (!pubResponse.ok) throw new Error('Publishing failed');
      const { url } = await pubResponse.json();
      
      setPublishedUrl(url);
      addStatus('Site published successfully to GitHub Pages!', 'success');
    } catch (error) {
      console.error(error);
      addStatus(error instanceof Error ? error.message : 'An unexpected error occurred', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">SiteGen</h1>
          <p className="mt-3 text-lg text-gray-500">
            One-shot website generation & instant publishing.
          </p>
        </div>

        {/* Dashboard Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <form onSubmit={handleGenerate} className="p-8 space-y-8">
            {/* Model Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProvider('gemini-cloud')}
                className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                  provider === 'gemini-cloud'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Cloud className={`w-5 h-5 mr-3 ${provider === 'gemini-cloud' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-sm tracking-wide">Gemini Cloud</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('gemma-local')}
                className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                  provider === 'gemma-local'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Cpu className={`w-5 h-5 mr-3 ${provider === 'gemma-local' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-sm tracking-wide">Local Gemma</span>
              </button>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label htmlFor="prompt" className="block text-sm font-bold text-gray-700 uppercase tracking-widest">
                Website Description
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="block w-full rounded-2xl border-gray-200 bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all p-4 resize-none border"
                placeholder="e.g., A minimalist portfolio for a landscape photographer with a dark theme and a gallery grid."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-400 italic">Describe your vision in 1-3 sentences.</p>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className={`w-full flex items-center justify-center py-4 px-6 rounded-2xl text-white font-bold text-lg tracking-wide transition-all duration-300 shadow-lg ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:transform active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Globe className="w-6 h-6 mr-3" />
                  Generate & Publish
                </>
              )}
            </button>
          </form>

          {/* Status Panel */}
          {status.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-8 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Log</h3>
              <div className="space-y-3">
                {status.map((item, index) => (
                  <div key={index} className="flex items-start animate-in fade-in slide-in-from-left-4 duration-500">
                    {item.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    ) : item.type === 'error' ? (
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    <p className={`text-sm ${
                      item.type === 'success' ? 'text-green-700 font-medium' :
                      item.type === 'error' ? 'text-red-700 font-medium' :
                      'text-gray-600'
                    }`}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>

              {publishedUrl && (
                <div className="mt-8 p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 animate-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Live URL</p>
                      <p className="text-white font-semibold truncate max-w-[200px] sm:max-w-md">
                        {publishedUrl}
                      </p>
                    </div>
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                    >
                      Visit Site
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center mt-12 text-gray-400 text-sm">
          Built with Gemini CLI & Next.js
        </p>
      </div>
    </main>
  );
}
