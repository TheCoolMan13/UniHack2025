# Collaboration Guide - Car Sharing App

This guide helps you and your friend work together efficiently while minimizing merge conflicts on GitHub.

## 🎯 Work Division Strategies

### Strategy 1: Frontend/Backend Split (Recommended for Start)
**Best for**: Early development when features are independent

- **Person A**: Works on **Frontend** (`frontend/` folder)
  - All React Native screens and components
  - UI/UX improvements
  - Frontend services and API integration
  
- **Person B**: Works on **Backend** (`backend/` folder)
  - API endpoints and controllers
  - Database logic
  - Backend services and matching algorithms

**Pros**: Minimal overlap, clear boundaries
**Cons**: Need good communication for API contracts

### Strategy 2: Feature-Based Split (Recommended for Later)
**Best for**: When building complete features end-to-end

Divide by features:
- **Person A**: 
  - Authentication feature (frontend + backend)
  - Profile management
  - Settings
  
- **Person B**:
  - Ride posting/searching (frontend + backend)
  - Map integration
  - Matching algorithm

**Pros**: Complete features, better testing
**Cons**: More coordination needed

### Strategy 3: Layer-Based Split
**Best for**: When you have different strengths

- **Person A**: 
  - Frontend UI/UX (screens, components, styling)
  - Backend API endpoints
  
- **Person B**:
  - Frontend logic/services (API calls, state management)
  - Backend business logic (matching, algorithms)

## 🔀 Git Workflow (Feature Branch Strategy)

### Step 1: Always Start from Updated Main
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Feature Branch
```bash
# Person A working on frontend auth
git checkout -b feature/frontend-auth

# Person B working on backend rides
git checkout -b feature/backend-rides
```

### Step 3: Work on Your Branch
- Make commits frequently (small, logical commits)
- Push your branch regularly: `git push origin feature/your-branch`

### Step 4: Before Merging
```bash
# Update your branch with latest main
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main  # or: git rebase main
```

### Step 5: Create Pull Request
- Create PR on GitHub
- Review each other's code
- Merge when approved

## 📁 File Ownership Rules

### Frontend Files (Person B's Domain)
- `frontend/app/screens/**`
- `frontend/app/components/**`
- `frontend/app/navigation/**`
- `frontend/services/api.js` (coordinate changes)
- `frontend/constants/**`

### Backend Files (Person A's Domain - Hosting)
- `backend/controllers/**`
- `backend/routes/**`
- `backend/services/**`
- `backend/middleware/**`
- `backend/config/**`
- `backend/server.js`
- Deployment and hosting setup

### Shared Files (Coordinate Changes!)
- `frontend/services/api.js` - API client
- `backend/routes/*.js` - API endpoints
- `package.json` files - Dependencies
- Root documentation files
- `.gitignore` files

## 🚨 Conflict Prevention Tips

### 1. Communicate Before Touching Shared Files
Before editing shared files, message your friend:
- "Hey, I'm updating the API client in `services/api.js`"
- "I'm adding a new endpoint to `/api/rides`"

### 2. Use Descriptive Branch Names
```bash
# Good
feature/frontend-login-screen
feature/backend-ride-matching
bugfix/map-loading-issue

# Bad
fix
update
changes
```

### 3. Keep Commits Small and Focused
```bash
# Good: One logical change per commit
git commit -m "Add login form validation"
git commit -m "Connect login to backend API"

# Bad: Everything in one commit
git commit -m "Update stuff"
```

### 4. Pull Before Starting Work
Always pull latest changes before starting:
```bash
git checkout main
git pull origin main
```

### 5. Coordinate on Package Updates
If you need to add/update dependencies:
- Message your friend first
- Update `package.json` and `package-lock.json` together
- Test that it doesn't break their work

## 📝 Daily Workflow Checklist

### Morning (Before Starting Work)
- [ ] Pull latest from main: `git pull origin main`
- [ ] Check if friend has open PRs
- [ ] Message friend about what you're working on today

### During Work
- [ ] Work on your feature branch
- [ ] Commit frequently with clear messages
- [ ] Push your branch regularly

### Before Ending Work
- [ ] Push all your changes: `git push origin feature/your-branch`
- [ ] Create/update PR if feature is ready
- [ ] Message friend about what you completed

## 🔧 Handling Conflicts (When They Happen)

### If You Get a Merge Conflict:

1. **Don't Panic!** Conflicts are normal.

2. **Pull the latest changes:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git merge main
   ```

3. **Open conflicted files** - Git marks conflicts like this:
   ```javascript
   <<<<<<< HEAD
   // Your code
   =======
   // Friend's code
   >>>>>>> main
   ```

4. **Resolve manually:**
   - Keep both changes if needed
   - Choose the better version
   - Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

5. **Test your changes** after resolving

6. **Commit the resolution:**
   ```bash
   git add .
   git commit -m "Resolve merge conflicts with main"
   ```

## 💬 Communication Guidelines

### What to Communicate:
- ✅ Starting work on a new feature
- ✅ Changing shared files (API, config, etc.)
- ✅ Adding new dependencies
- ✅ Breaking changes to API contracts
- ✅ When you're done with a feature and ready for review

### Communication Channels:
- Use GitHub PR comments for code reviews
- Use chat/messaging for quick coordination
- Update this guide if you establish new patterns

## 🎨 Code Style Agreement

### Before You Start:
1. Agree on code formatting (use Prettier/ESLint)
2. Agree on naming conventions
3. Agree on commit message format

### Example Commit Messages:
```
feat: Add user authentication screen
fix: Resolve map loading issue on Android
refactor: Improve ride matching algorithm
docs: Update API documentation
```

## 📋 Quick Reference

### Common Commands
```bash
# See what branch you're on
git branch

# Switch to main and update
git checkout main && git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature

# See what files you've changed
git status

# See your commit history
git log --oneline

# Push your branch
git push origin feature/your-branch
```

### Emergency: Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Emergency: Discard All Local Changes
```bash
git checkout .
```

## 🎯 Recommended Setup for This Project

Based on your project structure, we recommend:

**Week 1-2: Frontend/Backend Split**
- Person A: Backend API, database, hosting, server management
- Person B: Frontend screens, components, UI

**Week 3+: Feature-Based Split**
- Person A: Complete authentication feature
- Person B: Complete ride posting/searching feature

## ⚠️ Important Reminders

1. **Never commit directly to `main`** - Always use feature branches
2. **Always pull before pushing** - Avoid conflicts
3. **Test before merging** - Don't break the app
4. **Communicate changes** - Especially to shared files
5. **Review each other's PRs** - Catch bugs early

---

**Remember**: The goal is to work together smoothly, not to avoid conflicts entirely. When conflicts happen, resolve them together and learn from them!

