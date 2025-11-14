# Quick Guide: Share Database with Friend

## Your IP Address
- **Main IP**: `10.113.209.10`
- **Alternative**: `192.168.56.1`

## Step-by-Step Setup

### Step 1: Create MySQL User for Your Friend

**Option A: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Run this SQL:
```sql
CREATE USER 'friend_user'@'%' IDENTIFIED BY 'choose_secure_password';
GRANT ALL PRIVILEGES ON carshare_db.* TO 'friend_user'@'%';
FLUSH PRIVILEGES;
```

**Option B: Using Command Line**
```bash
mysql -u root -pQwertyasd1
```
Then run:
```sql
CREATE USER 'friend_user'@'%' IDENTIFIED BY 'choose_secure_password';
GRANT ALL PRIVILEGES ON carshare_db.* TO 'friend_user'@'%';
FLUSH PRIVILEGES;
```

### Step 2: Configure MySQL to Accept Remote Connections

**Find MySQL config file:**
- **XAMPP**: `C:\xampp\mysql\bin\my.ini`
- **WAMP**: `C:\wamp64\bin\mysql\mysql[version]\my.ini`
- **Standalone**: `C:\ProgramData\MySQL\MySQL Server [version]\my.ini`

**Edit the file:**
1. Find line: `bind-address = 127.0.0.1`
2. Change to: `bind-address = 0.0.0.0` (or comment it out with `#`)
3. Save the file
4. **Restart MySQL service**

### Step 3: Configure Windows Firewall

**Run PowerShell as Administrator:**
```powershell
New-NetFirewallRule -DisplayName "MySQL" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow
```

Or manually:
1. Open Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Port → TCP → 3306
5. Allow connection
6. Apply to all profiles
7. Name it "MySQL"

### Step 4: Give Your Friend These Connection Details

**Connection Information:**
```
Host: 10.113.209.10
Port: 3306
Database: carshare_db
Username: friend_user
Password: [the password you chose]
```

### Step 5: Your Friend's Setup

**For MySQL Workbench:**
1. Create new connection
2. Use the connection details above
3. Test connection

**For Backend Application:**
Update `backend/.env`:
```env
DB_HOST=10.113.209.10
DB_PORT=3306
DB_USER=friend_user
DB_PASSWORD=[the password you chose]
DB_NAME=carshare_db
```

## Testing Connection

**From your friend's computer, test with:**
```bash
mysql -h 10.113.209.10 -u friend_user -p carshare_db
```

Or use MySQL Workbench to test the connection.

## Troubleshooting

**If connection fails:**
1. ✅ Check MySQL is running on your computer
2. ✅ Verify firewall allows port 3306
3. ✅ Confirm MySQL bind-address is 0.0.0.0
4. ✅ Make sure both computers are on same network
5. ✅ Verify user was created correctly

**Check if MySQL is listening on network:**
```powershell
netstat -an | findstr 3306
```
Should show: `0.0.0.0:3306` (not just `127.0.0.1:3306`)

## Security Note

⚠️ **Only share on trusted local network!**
- Use strong passwords
- Don't expose to public internet
- Revoke access when done: `DROP USER 'friend_user'@'%';`

