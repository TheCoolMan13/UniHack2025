# Quick Start for Friend 👋

## Your Friend's IP Address
**Backend Server:** `10.113.209.10:3000`

---

## Steps for Your Friend

### 1. Get the Project
```bash
git clone [repo-url]
# or get project files from you
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Update API URL (IMPORTANT!)

**Edit `frontend/constants/config.js`:**

Change this line:
```javascript
BASE_URL: 'http://10.113.209.10:3000/api'  // Your friend's IP
```

### 4. Test Connection

Open browser and go to:
```
http://10.113.209.10:3000/api/health
```

Should see: `{"status":"OK","message":"Car Share API is running"}`

### 5. Run the App
```bash
cd frontend
npm start
```

Then open in Expo Go or simulator.

---

## That's It! 🎉

The app will now:
- ✅ Connect to your friend's backend
- ✅ Use your friend's database
- ✅ Share the same data

---

## If Friend Also Wants to Run Backend

**Edit `backend/.env`:**
```env
DB_HOST=10.113.209.10
DB_USER=friend_user
DB_PASSWORD=friend_password123
DB_NAME=carshare_db
DB_PORT=3306
```

Then run:
```bash
cd backend
npm install
npm run dev
```

---

## Troubleshooting

**"Network Error":**
- Check friend's backend is running
- Verify IP in `config.js` is correct: `10.113.209.10`
- Test `http://10.113.209.10:3000/api/health` in browser

**"Connection Refused":**
- Both on same WiFi?
- Friend's firewall allows connections?

