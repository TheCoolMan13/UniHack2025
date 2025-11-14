# Sharing Database with Team Member

## Option 1: Local Network Access (Same WiFi) - Recommended

### Step 1: Find Your IP Address
```powershell
ipconfig | findstr IPv4
```
You should see something like: `10.113.209.10` or `192.168.x.x`

### Step 2: Create MySQL User for Your Friend

Connect to MySQL and create a user:
```sql
CREATE USER 'friend_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON carshare_db.* TO 'friend_user'@'%';
FLUSH PRIVILEGES;
```

### Step 3: Configure MySQL to Accept Remote Connections

**For XAMPP:**
1. Edit `C:\xampp\mysql\bin\my.ini`
2. Find `bind-address = 127.0.0.1`
3. Change to `bind-address = 0.0.0.0` (or comment it out)
4. Restart MySQL service

**For WAMP:**
1. Edit `C:\wamp64\bin\mysql\mysql[version]\my.ini`
2. Same as above

**For Standalone MySQL:**
1. Edit `C:\ProgramData\MySQL\MySQL Server [version]\my.ini`
2. Same as above

### Step 4: Configure Windows Firewall

Allow MySQL through firewall:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "MySQL" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow
```

### Step 5: Give Your Friend Connection Details

**Connection Details:**
- Host: `10.113.209.10` (your IP address)
- Port: `3306`
- Database: `carshare_db`
- Username: `friend_user`
- Password: `secure_password_here`

**For MySQL Workbench:**
- Create new connection with above details

**For Application:**
- Update `.env` file:
  ```
  DB_HOST=10.113.209.10
  DB_PORT=3306
  DB_USER=friend_user
  DB_PASSWORD=secure_password_here
  DB_NAME=carshare_db
  ```

## Option 2: Use Cloud Database (Alternative)

If local network doesn't work, use a free cloud MySQL:
- **PlanetScale** (free tier)
- **Railway** (free tier)
- **Supabase** (free tier)
- **AWS RDS** (free tier for 12 months)

## Option 3: Export/Import Database

**Export:**
```bash
mysqldump -u root -p carshare_db > database_backup.sql
```

**Import (on friend's machine):**
```bash
mysql -u root -p carshare_db < database_backup.sql
```

## Security Notes

⚠️ **Important:**
- Only share database on trusted local network
- Use strong passwords
- Don't expose MySQL to public internet
- Consider using VPN for remote access
- Revoke access when done: `DROP USER 'friend_user'@'%';`

