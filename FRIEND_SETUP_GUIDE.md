# Setup Guide: Friend Accessing Your Backend/Database

## For YOU (Host - Running Backend)

### Step 1: Make Sure Backend is Running
```bash
cd backend
npm run dev
```
Should show: `🚀 Server running on port 3000`

### Step 2: Configure MySQL for Remote Access

**A. Edit MySQL Config File:**
- **XAMPP**: `C:\xampp\mysql\bin\my.ini`
- **WAMP**: `C:\wamp64\bin\mysql\mysql[version]\my.ini`
- **Standalone**: `C:\ProgramData\MySQL\MySQL Server [version]\my.ini`

Find this line:
```ini
bind-address = 127.0.0.1
```

Change to:
```ini
bind-address = 0.0.0.0
```

**B. Restart MySQL:**
- XAMPP: Stop and Start MySQL in Control Panel
- WAMP: Restart MySQL service
- Standalone: Restart MySQL service in Services

### Step 3: Create MySQL User for Friend

Open MySQL Workbench or command line and run:
```sql
CREATE USER 'friend_user'@'%' IDENTIFIED BY 'friend_password123';
GRANT ALL PRIVILEGES ON carshare_db.* TO 'friend_user'@'%';
FLUSH PRIVILEGES;
```

### Step 4: Configure Windows Firewall

**Run PowerShell as Administrator:**
```powershell
New-NetFirewallRule -DisplayName "MySQL" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 5: Give Your Friend These Details

**Your IP Address:** `10.113.209.10` (or check with `ipconfig`)

**Backend API:**
- URL: `http://10.113.209.10:3000/api`
- Port: `3000`

**Database:**
- Host: `10.113.209.10`
- Port: `3306`
- Database: `carshare_db`
- Username: `friend_user`
- Password: `friend_password123` (or whatever you chose)

---

## For YOUR FRIEND (Client)

### Step 1: Clone/Get the Project
```bash
git clone [your-repo-url]
# or get the project files
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Configure Backend Connection

**Edit `backend/.env`:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration - Connect to YOUR database
DB_HOST=10.113.209.10
DB_USER=friend_user
DB_PASSWORD=friend_password123
DB_NAME=carshare_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2025
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=*
```

**Note:** Friend can run backend on different port (3001) or not run it at all if only using frontend.

### Step 4: Configure Frontend to Use Your Backend

**Edit `frontend/constants/config.js`:**
```javascript
export const API_CONFIG = {
  // Point to YOUR backend server
  BASE_URL: 'http://10.113.209.10:3000/api',  // Your IP address
  
  TIMEOUT: 10000,
};
```

### Step 5: Test Connection

**Test Backend API:**
Open browser and go to:
```
http://10.113.209.10:3000/api/health
```
Should see: `{"status":"OK","message":"Car Share API is running"}`

**Test Database Connection:**
```bash
cd backend
node test-connection.js
```
Should connect successfully.

### Step 6: Run the App

**Option A: Friend Runs Frontend Only (Uses Your Backend)**
```bash
cd frontend
npm start
```
- Frontend will connect to your backend at `10.113.209.10:3000`
- All API calls go to your server
- All data is stored in your database

**Option B: Friend Runs Both Frontend and Backend**
```bash
# Terminal 1 - Backend (connects to your database)
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```
- Friend's backend connects to your database
- Friend's frontend can connect to either backend

---

## Quick Checklist

### For YOU (Host):
- [ ] Backend running on port 3000
- [ ] MySQL configured to accept remote connections (bind-address = 0.0.0.0)
- [ ] MySQL user created for friend
- [ ] Windows Firewall allows port 3000 and 3306
- [ ] Gave friend your IP address: `10.113.209.10`

### For YOUR FRIEND:
- [ ] Cloned/got the project
- [ ] Installed dependencies (`npm install`)
- [ ] Updated `frontend/constants/config.js` with your IP
- [ ] Updated `backend/.env` with database connection (if running backend)
- [ ] Tested connection to your backend API
- [ ] Started frontend app

---

## Testing

### Friend Tests Backend Connection:
```bash
# In browser or curl
http://10.113.209.10:3000/api/health
```

### Friend Tests Database Connection:
```bash
cd backend
node test-connection.js
```

### Friend Runs App:
```bash
cd frontend
npm start
# Then open in Expo Go or simulator
```

---

## Troubleshooting

**"Network Error" in app:**
- ✅ Check backend is running on your computer
- ✅ Verify friend's `config.js` has correct IP
- ✅ Test `http://10.113.209.10:3000/api/health` in browser

**"Database Connection Failed":**
- ✅ Check MySQL is running on your computer
- ✅ Verify MySQL bind-address is 0.0.0.0
- ✅ Check firewall allows port 3306
- ✅ Verify user credentials in friend's `.env`

**"Connection Refused":**
- ✅ Both on same WiFi network?
- ✅ Firewall configured correctly?
- ✅ Services running on your computer?

---

## Summary

**Friend's Setup:**
1. Get project files
2. Install dependencies
3. Update `frontend/constants/config.js` → Your IP: `10.113.209.10:3000`
4. (Optional) Update `backend/.env` → Your database connection
5. Run `npm start` in frontend
6. App connects to your backend/database!

That's it! Friend's app will use your backend and database.

