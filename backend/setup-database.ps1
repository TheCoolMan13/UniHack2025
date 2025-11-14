# PowerShell script to set up the database
# Make sure MySQL is installed and in your PATH, or update the mysql path below

Write-Host "Setting up Car Share database..." -ForegroundColor Green

# Option 1: If MySQL is in PATH
# Get-Content config\database.sql | mysql -u root -p

# Option 2: If MySQL is installed in default location, use full path
# Adjust the path based on your MySQL installation
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if (Test-Path $mysqlPath) {
    Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Yellow
    Write-Host "Please enter your MySQL root password when prompted..." -ForegroundColor Yellow
    Get-Content config\database.sql | & $mysqlPath -u root -p
} else {
    Write-Host "MySQL not found at default location." -ForegroundColor Red
    Write-Host "Please run the SQL script manually:" -ForegroundColor Yellow
    Write-Host "1. Open MySQL Workbench or your MySQL client" -ForegroundColor Cyan
    Write-Host "2. Connect to your MySQL server" -ForegroundColor Cyan
    Write-Host "3. Open and run: backend\config\database.sql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or add MySQL to your PATH and run:" -ForegroundColor Yellow
    Write-Host "Get-Content config\database.sql | mysql -u root -p" -ForegroundColor Cyan
}

