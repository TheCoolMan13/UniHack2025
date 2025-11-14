-- Quick Setup: Share Database with Friend
-- Run these commands in MySQL (MySQL Workbench or command line)

-- Step 1: Create a user for your friend (replace 'friend_password' with a secure password)
CREATE USER IF NOT EXISTS 'friend_user'@'%' IDENTIFIED BY 'friend_password';

-- Step 2: Grant all privileges on carshare_db database
GRANT ALL PRIVILEGES ON carshare_db.* TO 'friend_user'@'%';

-- Step 3: Apply the changes
FLUSH PRIVILEGES;

-- Verify the user was created
SELECT User, Host FROM mysql.user WHERE User = 'friend_user';

