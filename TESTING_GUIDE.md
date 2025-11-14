# Testing Guide - Car Sharing App

## Backend API Testing

### 1. Test Registration Endpoint

**Using curl (PowerShell):**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\",\"role\":\"both\"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "name": "Test User",
      "role": "both",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Test Login Endpoint

**Using curl:**
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Test Get Current User (with token)

**Using curl:**
```powershell
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend App Testing

### Step 1: Start Frontend

```bash
cd frontend
npm start
```

### Step 2: Test Authentication Flow

1. **Open the app** (Expo Go, simulator, or emulator)
2. **Register a new user:**
   - Go to Signup screen
   - Enter email, password, name
   - Select role (driver/passenger/both)
   - Submit
   - Should automatically log you in

3. **Test Login:**
   - Logout
   - Go to Login screen
   - Enter credentials
   - Should log in successfully

### Step 3: Test Ride Posting (Driver)

1. **Login as driver** (or user with "both" role)
2. **Switch to Driver mode** (if needed)
3. **Post a Ride:**
   - Go to "Post a Ride" screen
   - Select pickup location (use LocationSelection)
   - Select dropoff location
   - Set time (e.g., "7:30 AM")
   - Select days (e.g., Monday, Tuesday)
   - Set price (e.g., "10.00")
   - Set available seats
   - Submit
   - Should show success message

### Step 4: Test Ride Search (Passenger)

1. **Login as passenger** (or user with "both" role)
2. **Switch to Passenger mode** (if needed)
3. **Search for Rides:**
   - Go to "Search Rides" screen
   - Select pickup location
   - Select dropoff location
   - Set time
   - Select days
   - Search
   - Should show matching rides (if any)

### Step 5: Test Ride Request

1. **From Search Results:**
   - Click "Request Ride" on a matching ride
   - Should show success message
   - Driver will see the request in "My Rides"

## Common Issues & Solutions

### Issue: "Network Error" or "Connection Refused"

**Solution:**
- Check if backend is running (`http://localhost:3000/api/health`)
- For physical devices, update API URL in `frontend/constants/config.js`:
  - Use your computer's IP instead of `localhost`
  - Example: `http://192.168.1.100:3000/api`

### Issue: "401 Unauthorized"

**Solution:**
- Token might be expired
- Try logging out and logging back in
- Check if token is being stored correctly

### Issue: "Validation failed"

**Solution:**
- Check all required fields are filled
- Verify email format
- Check password length (min 6 characters)
- Verify coordinates are valid numbers

### Issue: "No matching rides found"

**Solution:**
- Make sure you've posted at least one ride as a driver
- Check that ride schedule matches your search criteria
- Verify locations are close enough (matching algorithm checks proximity)

## Testing Checklist

- [ ] Backend health check works
- [ ] User registration works
- [ ] User login works
- [ ] Token is stored after login
- [ ] User session persists on app restart
- [ ] Post ride works (driver)
- [ ] Search rides works (passenger)
- [ ] Request ride works
- [ ] Error messages display correctly
- [ ] Loading states work

## Next Steps After Testing

Once basic functionality is confirmed:
1. Test on physical device
2. Connect MapScreen to show real rides
3. Connect MyRidesScreen to show user's rides
4. Test edge cases (invalid data, network errors, etc.)
5. Add more features (geocoding, route visualization, etc.)

