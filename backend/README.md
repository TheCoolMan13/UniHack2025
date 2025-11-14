# Car Share Backend API

Node.js/Express backend API for the NibbleForce Car Sharing App.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database credentials
   - JWT secret key
   - Server port
   - CORS origin

3. **Create database:**
   ```bash
   mysql -u root -p < config/database.sql
   ```
   
   Or manually run the SQL script in your MySQL client.

4. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### Rides

- `POST /api/rides` - Create a new ride (Driver only)
- `GET /api/rides?role=driver|passenger` - Get user's rides
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id` - Update a ride (Driver only)
- `DELETE /api/rides/:id` - Delete a ride (Driver only)
- `POST /api/rides/search` - Search for matching rides
- `POST /api/rides/:id/request` - Request a ride (Passenger)
- `POST /api/rides/:id/accept` - Accept a ride request (Driver)
- `POST /api/rides/:id/reject` - Reject a ride request (Driver)

### Matching

- `POST /api/matching/search` - Search for matching rides using algorithm

### Health Check

- `GET /api/health` - Check API status

## Database Schema

The database includes the following tables:

- **users** - User accounts and profiles
- **rides** - Posted rides by drivers
- **ride_requests** - Ride requests from passengers
- **sessions** - JWT token management (optional)

See `config/database.sql` for the complete schema.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=carshare_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:8081
```

## Project Structure

```
backend/
├── config/
│   ├── database.js          # MySQL connection pool
│   └── database.sql         # Database schema
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── ridesController.js   # Rides CRUD logic
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Auth routes
│   ├── rides.js             # Rides routes
│   └── matching.js          # Matching routes
├── services/
│   └── matchingService.js   # Route matching algorithm
├── server.js                # Express app entry point
├── package.json
└── README.md
```

## Development

- Use `npm run dev` for development with auto-reload (nodemon)
- Use `npm start` for production

## Testing

Run tests (when implemented):
```bash
npm test
```

## Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Consider rate limiting for API endpoints
- Implement input sanitization (already using express-validator)

## Next Steps

1. Connect frontend to this backend API
2. Implement real-time features (WebSocket/Socket.io)
3. Add payment integration
4. Implement push notifications
5. Add comprehensive error logging
6. Set up CI/CD pipeline
7. Deploy to cloud platform

