# Car Sharing App

A React Native mobile application for car sharing where users can be either drivers (offering rides) or passengers (looking for rides). Features route matching, map integration, and commission-based payments.

## Features

- **User Authentication**: Onboarding, login, and signup with role selection (driver/passenger/both)
- **Role Switching**: Easy switching between driver and passenger modes
- **Post Rides**: Drivers can post rides with route, schedule, and pricing
- **Search Rides**: Passengers can search for matching rides based on route and schedule
- **Map Integration**: Interactive map showing available rides and routes
- **Route Matching**: Smart algorithm to match passenger routes with driver routes
- **My Rides**: View and manage posted/requested rides
- **User Profile**: Manage profile and settings

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Maps**: react-native-maps
- **Location**: expo-location
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **HTTP Client**: Axios

## Project Structure

```
UniHack2025/
├── app/
│   ├── components/          # Reusable UI components
│   │   └── common/          # Button, Input, Card, Header
│   ├── screens/             # Screen components
│   │   ├── auth/            # Onboarding, Login, Signup
│   │   ├── home/            # HomeScreen
│   │   ├── map/             # MapScreen
│   │   ├── ride/            # PostRide, SearchRide, MyRides
│   │   └── profile/         # ProfileScreen
│   └── navigation/          # Navigation configuration
├── components/              # Additional components (if needed)
├── constants/               # App constants, colors
├── context/                 # React Context providers (AuthContext)
├── services/                # API calls, geocoding, matching
└── App.js                   # Root component
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS (if using Expo):
```bash
cd ios && pod install && cd ..
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Configuration

### Maps Setup

For `react-native-maps` to work properly:

**iOS:**
- Add your Google Maps API key to `app.json`:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

**Android:**
- Add your Google Maps API key to `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

### Location Permissions

The app requests location permissions on first use. Make sure to:
- Add location permissions to `app.json`
- Test on a physical device for accurate location services

## Usage

### For Drivers

1. Sign up or log in as a driver
2. Switch to "Driver" mode on the home screen
3. Tap "Post a Ride"
4. Enter pickup and dropoff locations
5. Set schedule (days and time)
6. Set price and available seats
7. Post the ride

### For Passengers

1. Sign up or log in as a passenger
2. Switch to "Passenger" mode on the home screen
3. Tap "Search Rides"
4. Enter your pickup and dropoff locations
5. Set your schedule (days and time)
6. View matching rides
7. Request a ride

## Backend Integration

The app is currently using mock data. To connect to a backend:

1. Update `services/api.js` with your backend URL
2. Implement API endpoints as defined in the services
3. Update authentication in `context/AuthContext.js` to use real API calls
4. Update ride posting/searching to use real API endpoints

## Route Matching Algorithm

The route matching algorithm (`services/matchingService.js`) checks:
- Geographic matching: If passenger pickup/dropoff is on/near driver route
- Time matching: If schedules overlap within a time window
- Day matching: If days of week overlap

Match score is calculated based on these factors and results are sorted by relevance.

## Future Enhancements

- Real-time ride tracking
- In-app messaging between drivers and passengers
- Payment integration
- Ratings and reviews system
- Push notifications
- Ride history and analytics
- Advanced route optimization

## Development Notes

- Uses functional components with React Hooks
- Follows clean component structure
- Reusable components for consistency
- Clear comments and documentation
- ESLint-friendly code
- Modern UI with Google/Uber feel

## License

Private project
