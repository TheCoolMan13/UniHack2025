# Quick Fix for 500 Error

## What is Error 500?
- **500 = Internal Server Error** - The server crashed or encountered an error
- It's a **server-side problem**, not a frontend problem
- The frontend request is correct, but the backend failed to process it

## How to Find the Actual Error:

1. **Check the SERVER CONSOLE** (where you ran `npm run dev`)
   - Look for error messages like:
     - `CREATE RIDE ERROR`
     - `SEARCH RIDES ERROR`
     - `Error message: ...`
     - `Error stack: ...`

2. **Common Causes:**
   - Database connection error
   - Missing environment variables
   - Invalid data format
   - Missing database tables/columns
   - Code bugs (null reference, etc.)

## Quick Fixes:

### 1. Check if server is running:
```bash
# In backend directory
npm run dev
```

### 2. Check database connection:
```bash
# In backend directory
node test-connection.js
```

### 3. Check if tables exist:
```bash
# In backend directory
node check-db-schema.js
```

### 4. Check environment variables:
Make sure `backend/.env` has:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `GOOGLE_MAPS_API_KEY` (for route calculation)

## What to Do:

1. **Look at the SERVER CONSOLE** - it will show the actual error
2. **Share the error message** from the server console
3. I'll fix it based on the actual error

The error logs should show something like:
```
============================================================
CREATE RIDE ERROR
============================================================
Error: [actual error message here]
Error message: [details]
Error stack: [stack trace]
============================================================
```

