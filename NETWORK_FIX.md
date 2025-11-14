# Network Error Fix

## Problem
The frontend app was getting "Network Error" when trying to connect to the backend API.

## Root Cause
- On physical devices/emulators, `localhost` refers to the device itself, not your computer
- The backend was only listening on localhost
- CORS was restricting access

## Solution Applied

### 1. Updated Frontend API URL
Changed `frontend/constants/config.js` to use your computer's IP address:
```javascript
BASE_URL: 'http://10.113.209.10:3000/api'
```

### 2. Updated Backend Server
- Changed server to listen on `0.0.0.0` (all network interfaces) instead of just localhost
- Updated CORS to allow all origins in development

## Testing

### If using Android Emulator:
Update `frontend/constants/config.js`:
```javascript
BASE_URL: 'http://10.0.2.2:3000/api'  // Special IP for Android emulator
```

### If using iOS Simulator:
Update `frontend/constants/config.js`:
```javascript
BASE_URL: 'http://localhost:3000/api'  // localhost works for iOS simulator
```

### If using Physical Device:
Use your computer's IP address (already set):
```javascript
BASE_URL: 'http://10.113.209.10:3000/api'
```

## Important Notes

1. **Restart the backend server** after changes:
   ```bash
   cd backend
   npm run dev
   ```

2. **Restart the frontend** after changing the API URL:
   - Stop the Expo server (Ctrl+C)
   - Clear cache: `npm start -- --clear`
   - Or reload the app

3. **Firewall**: Make sure Windows Firewall allows connections on port 3000

4. **Network**: Make sure your device/emulator is on the same network as your computer

## Verify It Works

Test the connection from your device:
- Open browser on device/emulator
- Go to: `http://10.113.209.10:3000/api/health`
- Should see: `{"status":"OK","message":"Car Share API is running"}`

If that works, the app should now be able to connect!

