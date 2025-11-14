# Database Setup Guide

## Option 1: Using MySQL Command Line (PowerShell)

### If MySQL is in your PATH:
```powershell
Get-Content config\database.sql | mysql -u root -p
```

### If MySQL is NOT in your PATH:
1. Find your MySQL installation path (usually `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`)
2. Run:
```powershell
Get-Content config\database.sql | "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Or use the setup script:
```powershell
.\setup-database.ps1
```

## Option 2: Using MySQL Workbench (Recommended for Windows)

1. **Open MySQL Workbench**
2. **Connect to your MySQL server** (usually localhost, port 3306)
3. **Open the SQL script**: File → Open SQL Script → Select `backend\config\database.sql`
4. **Execute the script**: Click the Execute button (⚡) or press `Ctrl+Shift+Enter`

## Option 3: Using phpMyAdmin or Other GUI Tools

1. Open your MySQL GUI tool
2. Select your database server
3. Import or execute the SQL file: `backend\config\database.sql`

## Option 4: Manual Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS carshare_db;
   ```

2. **Select the database:**
   ```sql
   USE carshare_db;
   ```

3. **Run the SQL commands** from `config\database.sql` in your MySQL client

## Verify Setup

After running the script, verify the tables were created:

```sql
USE carshare_db;
SHOW TABLES;
```

You should see:
- `users`
- `rides`
- `ride_requests`
- `sessions`

## Next Steps

1. Update your `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=carshare_db
   DB_PORT=3306
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

