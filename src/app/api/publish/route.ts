import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function POST(req: Request) {
  try {
    const { html, slug } = await req.json();

    if (!html || !slug) {
      return NextResponse.json({ error: 'HTML and slug are required' }, { status: 400 });
    }

    // 1. Prepare directory structure
    const date = new Date();
    const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '');
    const folderName = `${yyyymmdd}-${slug}`;
    const relativePath = path.join('generated-sites', folderName);
    const absolutePath = path.join(process.cwd(), relativePath);

    // Ensure parent directories exist
    if (!fs.existsSync(path.join(process.cwd(), 'generated-sites'))) {
      fs.mkdirSync(path.join(process.cwd(), 'generated-sites'), { recursive: true });
    }

    fs.mkdirSync(absolutePath, { recursive: true });

    // 2. Write index.html
    fs.writeFileSync(path.join(absolutePath, 'index.html'), html);

    // 3. Git operations
    try {
      // Configure git for this repo if not already set (optional but helpful for automation)
      // execSync('git config user.name "SiteGen Bot"', { stdio: 'ignore' });
      // execSync('git config user.email "bot@sitegen.local"', { stdio: 'ignore' });

      // Fetch the latest to avoid conflicts
      execSync('git fetch origin main', { stdio: 'inherit' });
      
      // Attempt to pull, but ignore errors if it's the first time or nothing to merge
      try {
        execSync('git pull origin main --rebase', { stdio: 'inherit' });
      } catch (e) {
        console.warn('Git pull/rebase warning (likely first run or no changes):', e);
      }
      
      // Add, commit, push
      execSync(`git add "${relativePath}"`, { stdio: 'inherit' });
      execSync(`git commit -m "Add generated site: ${folderName}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
    } catch (gitError: unknown) {
      const message = gitError instanceof Error ? gitError.message : 'Unknown Git error';
      console.error('Git operation failed:', message);
      // We proceed because the file is still saved locally
    }

    // 4. Construct live URL
    const username = 'adamjkwong'; 
    const repo = 'sitegen';
    // GitHub Pages URL structure for project sites: https://<username>.github.io/<repo>/<path>/
    const liveUrl = `https://${username}.github.io/${repo}/generated-sites/${folderName}/`;

    return NextResponse.json({ url: liveUrl });
  } catch (error) {
    console.error('Publishing error:', error);
    return NextResponse.json({ error: 'Failed to publish website' }, { status: 500 });
  }
}
