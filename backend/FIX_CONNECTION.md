# Fixing MySQL Connection Issues

## Current Error
```
Access denied for user 'root'@'localhost' (using password: YES)
```

This means your `.env` file has incorrect MySQL credentials.

## Step 1: Test Your Connection

Run the connection test script:
```powershell
node test-connection.js
```

This will show you exactly what's wrong with your connection.

## Step 2: Update Your .env File

Open `backend\.env` and verify these settings:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=carshare_db
DB_PORT=3306
```

### Common Scenarios:

#### If using XAMPP/WAMP (default setup):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty (no password by default)
DB_NAME=carshare_db
DB_PORT=3306
```

#### If using MySQL installed separately:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=carshare_db
DB_PORT=3306
```

#### If using MySQL Workbench:
1. Check your connection settings in MySQL Workbench
2. Use the same username/password in your `.env` file

## Step 3: Verify MySQL is Running

### Check MySQL Service (Windows):
```powershell
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

Or check in Services:
- Press `Win + R`
- Type `services.msc`
- Look for "MySQL" service
- Make sure it's "Running"

### Test MySQL Connection Manually:
```powershell
# If MySQL is in PATH:
mysql -u root -p

# Or use full path:
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## Step 4: Create Database (if needed)

If the database doesn't exist:

1. **Using MySQL Command Line:**
   ```sql
   CREATE DATABASE carshare_db;
   ```

2. **Using MySQL Workbench:**
   - Connect to MySQL
   - Run: `CREATE DATABASE carshare_db;`
   - Then run the `config\database.sql` script

## Step 5: Reset MySQL Root Password (if needed)

If you forgot your MySQL root password:

### Option 1: Using MySQL Workbench
- Use "Reset Password" feature in MySQL Workbench

### Option 2: Using Command Line
1. Stop MySQL service
2. Start MySQL in safe mode (skip grant tables)
3. Connect and reset password
4. Restart MySQL service

## Quick Fix Checklist

- [ ] MySQL service is running
- [ ] `.env` file exists in `backend` folder
- [ ] `.env` has correct `DB_PASSWORD` (or empty if no password)
- [ ] Database `carshare_db` exists
- [ ] User has permissions to access the database
- [ ] Port 3306 is correct (or update `DB_PORT` in `.env`)

## After Fixing

1. Test connection:
   ```powershell
   node test-connection.js
   ```

2. If test passes, start the server:
   ```powershell
   npm run dev
   ```

