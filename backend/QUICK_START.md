# Quick Start Guide - Backend Setup

## Step 1: Install Dependencies

If you haven't already, install backend dependencies:

```powershell
cd backend
npm install
```

## Step 2: Configure Environment Variables

1. **Open `backend/.env` file**
2. **Update MySQL credentials:**
   - `DB_PASSWORD`: Your MySQL root password (leave empty if no password)
   - If using XAMPP/WAMP, default is usually empty password
   - If using MySQL Server, use your root password

Example for XAMPP/WAMP (no password):
```env
DB_PASSWORD=
```

Example for MySQL Server (with password):
```env
DB_PASSWORD=your_mysql_password
```

## Step 3: Test Database Connection

Test if your database credentials are correct:

```powershell
node test-connection.js
```

**Expected output if successful:**
```
✅ Connection successful!
  Current Database: carshare_db
  Current User: root@localhost
  Tables found: 4
```

**If you see an error:**
- Check your MySQL password in `.env`
- Make sure MySQL service is running
- See `FIX_CONNECTION.md` for troubleshooting

## Step 4: Create Database and Tables

If the database doesn't exist or tables are missing, run the SQL script:

### Option A: Using PowerShell Script
```powershell
.\setup-database.ps1
```

### Option B: Using MySQL Workbench (Recommended)
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `backend\config\database.sql`
4. Click Execute (⚡) or press `Ctrl+Shift+Enter`

### Option C: Using Command Line
```powershell
# If MySQL is in PATH:
Get-Content config\database.sql | mysql -u root -p

# Or with full path:
Get-Content config\database.sql | "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## Step 5: Verify Database Setup

Run the connection test again to verify tables were created:

```powershell
node test-connection.js
```

You should see:
- ✅ Connection successful
- Tables found: 4 (users, rides, ride_requests, sessions)

## Step 6: Start the Backend Server

### Development Mode (with auto-reload):
```powershell
npm run dev
```

### Production Mode:
```powershell
npm start
```

**Expected output:**
```
✅ Database connected successfully
🚀 Server running on port 3000
📱 Environment: development
```

## Step 7: Test the API

Open your browser or use curl/Postman:

**Health Check:**
```
GET http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "message": "Car Share API is running"
}
```

## Troubleshooting

### MySQL Connection Error
- See `FIX_CONNECTION.md` for detailed troubleshooting
- Common issues:
  - Wrong password in `.env`
  - MySQL service not running
  - Database doesn't exist

### Port Already in Use
If port 3000 is already in use:
1. Change `PORT` in `.env` to a different port (e.g., 3001)
2. Restart the server

### Module Not Found
If you see "Cannot find module" errors:
```powershell
npm install
```

## Next Steps

Once the backend is running:
1. ✅ Backend API is ready
2. 🔄 Connect frontend to backend (see IMPLEMENTATION_PLAN.md)
3. 🧪 Test API endpoints with Postman or curl

## API Endpoints

Once running, you can test these endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Rides
- `POST /api/rides` - Create ride (requires auth, driver role)
- `GET /api/rides` - Get user's rides
- `POST /api/rides/search` - Search for rides

### Matching
- `POST /api/matching/search` - Find matching rides

### Health
- `GET /api/health` - Check API status

