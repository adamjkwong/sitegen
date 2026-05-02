'use client';

import { useState } from 'react';
import { Sparkles, Globe, Cpu, CheckCircle2, Loader2, ExternalLink, Github, Terminal, Save, GitBranch, Share2, Circle } from 'lucide-react';

type StepStatus = 'pending' | 'running' | 'completed' | 'error';

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: 'gen', label: 'AI Generation', description: 'Generating HTML with Gemma 4 (Local)', status: 'pending' },
    { id: 'fs', label: 'Local Storage', description: 'Writing files to generated-sites/', status: 'pending' },
    { id: 'git', label: 'Version Control', description: 'Staging and committing to Git', status: 'pending' },
    { id: 'push', label: 'GitHub Sync', description: 'Pushing changes to remote repository', status: 'pending' },
    { id: 'deploy', label: 'Finalizing', description: 'Constructing GitHub Pages URL', status: 'pending' },
  ]);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateStep = (id: string, status: StepStatus) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setPublishedUrl(null);
    setErrorMessage(null);
    setSteps(s => s.map(step => ({ ...step, status: 'pending' })));

    try {
      // Step 1: AI Generation
      updateStep('gen', 'running');
      const genResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!genResponse.ok) {
        const errorData = await genResponse.json();
        updateStep('gen', 'error');
        throw new Error(errorData.error || 'Generation failed');
      }

      const { html, slug } = await genResponse.json();
      updateStep('gen', 'completed');

      // Step 2-6: Publication (Backend handles these, we track progression)
      updateStep('fs', 'running');
      const pubResponse = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, slug }),
      });

      if (!pubResponse.ok) {
        const errorData = await pubResponse.json();
        updateStep('fs', 'error'); // Roughly where it would fail
        throw new Error(errorData.error || 'Publishing failed');
      }

      const { url } = await pubResponse.json();
      
      // Mark remaining steps as completed sequentially for visual accuracy
      updateStep('fs', 'completed');
      updateStep('git', 'completed');
      updateStep('push', 'completed');
      updateStep('deploy', 'completed');
      
      setPublishedUrl(url);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">SiteGen Local</span>
          </div>
          <a 
            href="https://github.com/adamjkwong/sitegen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>View Source</span>
          </a>
        </div>

        {/* Dashboard Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
          <form onSubmit={handleGenerate} className="p-8 space-y-8">
            <div className="space-y-3">
              <label htmlFor="prompt" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                System Prompt
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="block w-full rounded-2xl border-gray-200 bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all p-4 resize-none border text-lg"
                placeholder="Describe your vision..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <div className="flex items-center text-xs text-blue-600 font-medium">
                <Terminal className="w-3 h-3 mr-1" />
                Processing locally with gemma4:e4b
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className={`w-full flex items-center justify-center py-5 px-6 rounded-2xl text-white font-bold text-lg tracking-wide transition-all duration-300 shadow-lg ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:transform active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Orchestrating Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3" />
                  Generate & Publish
                </>
              )}
            </button>
          </form>

          {/* Progression Tracker */}
          {(isGenerating || steps.some(s => s.status !== 'pending')) && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Pipeline Execution</h3>
              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start">
                    <div className="mt-1 mr-4">
                      {step.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {step.status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                      {step.status === 'pending' && <Circle className="w-5 h-5 text-gray-300" />}
                      {step.status === 'error' && <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">!</div>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${
                        step.status === 'completed' ? 'text-gray-900' : 
                        step.status === 'running' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-bold uppercase mb-1">Error Detected</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {publishedUrl && (
                <div className="mt-8 p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 animate-in zoom-in-95 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Deployment Successful</p>
                      <p className="text-white font-semibold truncate text-sm">
                        {publishedUrl}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href={publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        Visit Site
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-6">
             <div className="flex items-center text-gray-400 text-xs">
              <Save className="w-3 h-3 mr-1" />
              Local-First
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <GitBranch className="w-3 h-3 mr-1" />
              Git-Automated
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <Share2 className="w-3 h-3 mr-1" />
              GitHub Pages
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 SiteGen Local • Built by <a href="https://github.com/adamjkwong" className="underline hover:text-gray-600">Adam Kwong</a>
          </p>
        </div>
      </div>
    </main>
  );
}
