# Push to GitHub - Complete Instructions

Your git repository is locally configured and ready! Follow these steps to upload to GitHub.

## Step 1: Create GitHub Repository

1. Go to **https://github.com/new**
2. Fill in the details:
   - **Repository name**: `dayoff` (or your preferred name)
   - **Description**: "Day Off Request Management System - Employee vacation request with approval workflow"
   - **Public/Private**: Choose Public to share or Private for personal use
   - **Do NOT initialize** with README (we already have one)
3. Click **"Create repository"**

## Step 2: Connect Local Repo to GitHub

After creating the repo, GitHub will show you commands. Copy-paste these in PowerShell:

```powershell
cd 'c:\DayOff - Copy'

# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/dayoff.git

# Rename branch to main (if needed)
git branch -M main

# Push all commits and set upstream
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username.

## Step 3: Authenticate with GitHub

When you run `git push`, you'll be prompted for authentication. You have options:

### Option A: Use GitHub CLI (Recommended)
```powershell
# Install GitHub CLI if not already installed
choco install gh -y

# Authenticate
gh auth login

# Follow the prompts to authenticate
```

### Option B: Use Personal Access Token (PAT)
1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `dayoff-push`
4. Select scopes: Check `repo` (full control of private repositories)
5. Click **"Generate token"** and copy it
6. When git asks for password, paste the token instead
7. Save the token securely!

### Option C: Use SSH (Advanced)
```powershell
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "yousef.dev.321@gmail.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub:
# https://github.com/settings/keys
```

## Step 4: Complete the Push

After authentication is set up, run:

```powershell
cd 'c:\DayOff - Copy'
git push -u origin main
```

You should see output like:
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (80/80), done.
Writing objects: 100% (150/150), 15.2 MiB, done.
Total 150 (delta 45), reused 0 (delta 0), reused pack 0 (delta 0)
remote: Resolving deltas: 100% (45/45), done.
To https://github.com/YOUR_USERNAME/dayoff.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Step 5: Verify Upload

Once complete, your repository will be live at:

```
https://github.com/YOUR_USERNAME/dayoff
```

Visit that URL to see your code on GitHub!

## Quick Commands Reference

```powershell
# Check current remote
git remote -v

# Show commit history
git log --oneline

# Check status
git status

# After making more changes, push with:
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

**"Authentication failed"**
- Ensure you're using a valid token or SSH key
- Check that GitHub account has push permissions to the repo

**"Permission denied (publickey)"**
- You need to add your SSH key to GitHub
- Or use HTTPS with a token instead

**"Repository not found"**
- Verify the remote URL is correct: `git remote -v`
- Make sure you created the repo on GitHub first
- Check spelling of USERNAME and repository name

**Already exists? Want to push to existing repo?**
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/your-existing-repo.git
git push -u origin main
```

## What Gets Uploaded?

Based on your `.gitignore`:
- ✅ All source code (models, routes, views, public)
- ✅ Configuration files (package.json, app.js)
- ✅ README.md and documentation
- ❌ node_modules/ (too large, will be ignored)
- ❌ .env (security - should never be committed)
- ❌ Test/debug files (kept locally only)

## Next Steps After Upload

1. **Clone from anywhere**: `git clone https://github.com/YOUR_USERNAME/dayoff.git`
2. **Share the link**: Give others the repository URL
3. **Set up CI/CD**: Add GitHub Actions for automated testing
4. **Add collaborators**: Invite team members in GitHub settings
5. **Create releases**: Tag important versions with `git tag`

---

**Status**: Repository is ready for GitHub! 🚀
