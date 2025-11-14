# Quick Collaboration Reference Card

## 🚀 Daily Workflow (Copy This!)

### Start of Day
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### During Work
```bash
# Make changes, then:
git add .
git commit -m "feat: description of what you did"
git push origin feature/your-feature-name
```

### End of Day
```bash
git push origin feature/your-feature-name  # Make sure everything is pushed!
```

## 📍 Work Division (Choose One)

### Option A: Frontend/Backend Split
- **You**: `frontend/` folder only
- **Friend**: `backend/` folder only

### Option B: Feature Split
- **You**: Auth + Profile features
- **Friend**: Rides + Map features

## ⚠️ Before Editing These Files, Message Your Friend!

- `frontend/services/api.js`
- `backend/routes/*.js`
- `package.json` (any)
- `*.config.js` files
- Root documentation

## 🔥 Emergency Commands

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Discard all local changes
```bash
git checkout .
```

### See what you changed
```bash
git status
```

### Update your branch with main
```bash
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main
```

## 💬 Communication Template

**Starting work:**
> "Hey! Starting work on [feature]. Working in [folder/file]."

**Touching shared file:**
> "Hey! Need to update [file]. Is it safe to edit?"

**Done with feature:**
> "Done with [feature]! PR is ready for review."

---

**Full guide**: See `COLLABORATION_GUIDE.md`

