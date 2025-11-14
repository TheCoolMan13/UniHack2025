# Setup Google Maps API Key for Backend

## ❌ Current Issue

The API key is **NOT set** in `backend/.env`, which is why you're getting a 403 error.

## ✅ Quick Fix

### Step 1: Get Your API Key

You have two options:

**Option A: Use the same key from frontend**
- Check `frontend/.env` for `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Copy that value

**Option B: Get it from Google Cloud Console**
- Go to https://console.cloud.google.com/
- Navigate to **APIs & Services** → **Credentials**
- Find your API key

### Step 2: Add to Backend .env

1. Open `backend/.env` file
2. Add this line (replace with your actual key):

```env
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Example:**
```env
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Enable Directions API

1. Go to https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Library**
3. Search for "Directions API"
4. Click **Enable**

### Step 4: Restart Backend Server

```bash
# Stop the server (CTRL+C)
# Then restart:
cd backend
npm run dev
```

### Step 5: Test Again

```bash
cd backend
node test-route-calculation.js
```

## 🔍 Verify API Key Setup

Run this to check:
```bash
cd backend
node check-api-key.js
```

## ⚠️ Important Notes

1. **Use the same key as frontend** - You can use the same Google Maps API key
2. **Enable Directions API** - Make sure it's enabled in Google Cloud Console
3. **No restrictions** - For development, don't restrict the API key to specific IPs/domains
4. **Billing enabled** - Make sure billing is enabled (free tier available)

## 🐛 Still Getting 403?

Check:
- [ ] API key is correct (no typos)
- [ ] Directions API is enabled
- [ ] Billing is enabled in Google Cloud
- [ ] API key has no IP/domain restrictions
- [ ] Server was restarted after adding key

## ✅ Success Indicators

When it works, you should see:
- ✅ Route distance (in km)
- ✅ Route duration (in minutes)
- ✅ Polyline string (encoded route)
- ✅ Route distance > straight-line distance

