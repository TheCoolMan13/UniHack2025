# Environment Variables Setup

## Setup Instructions

### 1. Create .env File

Copy the example file:
```bash
cp .env.example .env
```

Or create `.env` manually in the `frontend` folder.

### 2. Add Your API Key

Edit `.env` and add your Google Maps API key:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Restart Expo

After creating/updating `.env`, restart Expo:
```bash
npm start -- --clear
```

## Important Notes

- ✅ `.env` is in `.gitignore` - it will NOT be committed to git
- ✅ `.env.example` is committed - it's a template for others
- ✅ All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- ⚠️ Never commit `.env` file with real API keys

## Available Environment Variables

- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL (optional, can use config.js instead)

## For Team Members

When cloning the project:
1. Copy `.env.example` to `.env`
2. Fill in your own API keys
3. Never commit `.env` to git

