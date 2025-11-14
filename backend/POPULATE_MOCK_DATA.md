# Populate Mock Data Script

This script populates the database with mock data from Timisoara, Romania for testing purposes.

## What It Does

- **Creates 50 test users** (TEST_USER_1 through TEST_USER_50)
- **Each user has exactly 5 rides** (250 total rides)
- **All locations are from Timisoara, Romania** with real coordinates
- **Varying times, locations, and prices** for realistic testing

## Usage

```bash
cd backend
node populate-mock-data.js
```

## Test User Credentials

All test users use the same password for convenience:

- **Email format**: `test_user_N@timisoara.test` (where N is 1-50)
- **Password**: `test123456`
- **Example**: 
  - Email: `test_user_1@timisoara.test`
  - Password: `test123456`

## Data Details

### Users
- **Names**: TEST_USER_1, TEST_USER_2, ..., TEST_USER_50
- **Role**: All users are drivers
- **Rating**: Random between 3.5 and 5.0
- **Verified**: All users are verified
- **Phone**: Random Romanian phone numbers

### Rides
- **Locations**: 20 real locations in Timisoara, Romania
  - Piata Unirii, Piata Victoriei, Gara Timisoara Nord
  - Aeroportul Timisoara, Universitatea Politehnica
  - Iulius Town, Complexul Studentesc, etc.
- **Times**: Morning commute (6:00 AM - 9:30 AM) and evening (5:00 PM - 7:30 PM)
- **Days**: Mostly weekdays (Monday-Friday), some include weekends
- **Prices**: 5-25 RON (Romanian Leu)
- **Seats**: 1-4 available seats
- **Status**: All rides are active

## Clearing Test Data

The script automatically clears existing test data before populating. It deletes:
- All rides from users with names like `TEST_USER_%`
- All users with names like `TEST_USER_%`

## Re-running the Script

You can run the script multiple times. It will:
1. Clear all existing test data
2. Create fresh test users and rides

## Notes

- The script uses real coordinates from Timisoara, Romania
- Locations have small random offsets (up to 2km) for variety
- All rides are set to 'active' status
- Users are created with verified status

