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

    if (!fs.existsSync(path.join(process.cwd(), 'generated-sites'))) {
      fs.mkdirSync(path.join(process.cwd(), 'generated-sites'), { recursive: true });
    }

    fs.mkdirSync(absolutePath, { recursive: true });

    // 2. Write index.html
    fs.writeFileSync(path.join(absolutePath, 'index.html'), html);

    // 3. Git operations
    try {
      // Ensure we are up to date
      execSync('git pull origin main', { stdio: 'inherit' });
      
      // Add, commit, push
      execSync(`git add ${relativePath}`, { stdio: 'inherit' });
      execSync(`git commit -m "Add generated site: ${folderName}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
    } catch (gitError) {
      console.error('Git operation failed:', gitError);
      // We might proceed if commit fails (e.g. no changes, though unlikely here)
    }

    // 4. Construct live URL
    // Assuming GitHub Pages is set up for the repo
    const username = 'adamjkwong'; // We can potentially detect this via 'gh api user -q .login'
    const repo = 'sitegen';
    const liveUrl = `https://${username}.github.io/${repo}/${relativePath}/`;

    return NextResponse.json({ url: liveUrl });
  } catch (error) {
    console.error('Publishing error:', error);
    return NextResponse.json({ error: 'Failed to publish website' }, { status: 500 });
  }
}
