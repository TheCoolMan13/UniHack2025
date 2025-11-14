# Backend Setup Guide - Step by Step

## Current Status

✅ Dependencies installed  
✅ .env file exists  
❌ Database connection failing (password issue)

## Quick Fix Steps

### Step 1: Check MySQL Service

First, verify MySQL is running:

```powershell
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

**If MySQL is not running:**
- **XAMPP**: Start MySQL from XAMPP Control Panel
- **WAMP**: Start MySQL from WAMP menu
- **MySQL Server**: Start MySQL service from Services (services.msc)

### Step 2: Fix Database Password

The connection is failing because of incorrect MySQL password. 

**Option A: If using XAMPP/WAMP (usually no password):**

1. Open `backend\.env` file
2. Find this line:
   ```
   DB_PASSWORD=your_password
   ```
3. Change it to (empty password):
   ```
   DB_PASSWORD=
   ```
4. Save the file

**Option B: If using MySQL Server (with password):**

1. Open `backend\.env` file
2. Find this line:
   ```
   DB_PASSWORD=your_password
   ```
3. Replace `your_password` with your actual MySQL root password
4. Save the file

**Option C: Test your MySQL password manually:**

```powershell
# Try connecting with MySQL command line
mysql -u root -p
```

If this works, use the same password in `.env` file.

### Step 3: Test Connection Again

After updating the password, test the connection:

```powershell
cd backend
node test-connection.js
```

**Expected success output:**
```
✅ Connection successful!
  Current Database: carshare_db
  Current User: root@localhost
  Tables found: 4
```

### Step 4: Create Database (if needed)

If you see "Database does not exist" error:

**Using MySQL Workbench (Easiest):**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Run this command:
   ```sql
   CREATE DATABASE IF NOT EXISTS carshare_db;
   ```
4. Then run the schema: File → Open SQL Script → `backend\config\database.sql` → Execute

**Using Command Line:**
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS carshare_db;"
Get-Content backend\config\database.sql | mysql -u root -p
```

**Using PowerShell Script:**
```powershell
cd backend
.\setup-database.ps1
```

### Step 5: Verify Tables Created

After creating the database, verify tables exist:

```powershell
node test-connection.js
```

You should see:
- ✅ Connection successful
- Tables found: 4 (users, rides, ride_requests, sessions)

### Step 6: Start the Backend Server

Once database connection works:

```powershell
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
🚀 Server running on port 3000
📱 Environment: development
```

### Step 7: Test API Endpoint

Open browser or use curl:

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

## Common Issues & Solutions

### Issue 1: "Access denied for user 'root'@'localhost'"

**Solution:**
- Check password in `.env` file
- Try empty password if using XAMPP/WAMP
- Verify MySQL is running

### Issue 2: "ECONNREFUSED" or "Cannot connect"

**Solution:**
- MySQL service is not running
- Start MySQL from XAMPP/WAMP or Services
- Check if MySQL is on port 3306 (or update `DB_PORT` in `.env`)

### Issue 3: "Database does not exist"

**Solution:**
- Create database: `CREATE DATABASE carshare_db;`
- Run the SQL script: `backend\config\database.sql`

### Issue 4: "Port 3000 already in use"

**Solution:**
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

## Next Steps After Backend Works

1. ✅ Backend API is running
2. 🔄 Test API endpoints (register, login, etc.)
3. 🔄 Connect frontend to backend
4. 🧪 Test full application flow

## Testing API Endpoints

Once backend is running, you can test with:

**Postman/Thunder Client:**
- Import the endpoints from `backend/README.md`
- Test register, login, etc.

**curl (PowerShell):**
```powershell
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"password123\",\"name\":\"Test User\",\"role\":\"passenger\"}'
```

## Need Help?

- See `FIX_CONNECTION.md` for detailed troubleshooting
- See `SETUP.md` for database setup options
- Check `README.md` for API documentation

