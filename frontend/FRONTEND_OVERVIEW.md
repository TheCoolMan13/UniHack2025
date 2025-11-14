# Frontend Overview - Quick Rundown

## 🎯 Project Overview
**NibbleForce Car Share** - A React Native (Expo) car-sharing app where you handle the frontend and your friend handles the backend.

---

## 📁 Project Structure

```
frontend/
├── App.js                    # Root component (wraps with AuthProvider)
├── app/
│   ├── index.js             # App entry point
│   ├── navigation/           # Navigation setup
│   │   ├── AppNavigator.js   # Root navigator (Auth ↔ Main)
│   │   ├── AuthNavigator.js  # Login/Signup/Onboarding
│   │   └── MainNavigator.js  # Bottom tabs (Home, Map, MyRides, Profile)
│   ├── screens/              # All app screens
│   │   ├── auth/            # LoginScreen, SignupScreen, OnboardingScreen
│   │   ├── home/            # HomeScreen (main dashboard)
│   │   ├── map/             # MapScreen, LocationSelectionScreen
│   │   ├── ride/            # PostRideScreen, SearchRideScreen, MyRidesScreen, DeliverPackageScreen
│   │   └── profile/         # ProfileScreen
│   ├── components/          # (Not used - components are in root)
│   ├── services/            # (Not used - services are in root)
│   └── utils/               # (Not used - utils are in root)
├── components/              # Reusable UI components
│   └── common/             # Button, Card, Header, Input, SearchBar, ServiceButton
├── constants/               # App-wide constants
│   ├── colors.js           # Color palette
│   ├── config.js           # API config (points to friend's backend)
│   └── index.js            # Exports
├── context/                 # React Context providers
│   └── AuthContext.js      # Authentication state management
├── services/                # API integration
│   ├── api.js              # Axios setup + API endpoints
│   ├── geocoding.js        # (Structure exists, not fully implemented)
│   └── matchingService.js  # (Structure exists, not fully implemented)
└── hooks/                  # Custom hooks (Expo-generated)
```

---

## 🔑 Key Technologies

- **React Native** (0.81.4) with **Expo** (~54.0.13)
- **React Navigation** (v7) - Stack & Bottom Tabs
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Token & user data persistence
- **React Native Maps** - Map functionality
- **Expo Location** - Geolocation services

---

## 🔐 Authentication System

### AuthContext (`context/AuthContext.js`)
**Status**: ✅ Fully integrated with backend

**Features:**
- Login/Register with backend API
- JWT token storage in AsyncStorage
- Auto token verification on app start
- Role switching (driver/passenger/both)
- Session persistence
- Logout with token cleanup

**API Endpoints Used:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me` (verify token)
- `POST /api/auth/logout`

**Usage:**
```javascript
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, currentRole, login, logout, switchRole } = useAuth();
```

---

## 🧭 Navigation Structure

### AppNavigator (Root)
- Switches between `AuthNavigator` and `MainNavigator` based on auth state
- Shows loading spinner while checking authentication

### AuthNavigator
- **OnboardingScreen** → First-time user flow
- **LoginScreen** → User login
- **SignupScreen** → User registration

### MainNavigator (Bottom Tabs)
1. **Home Tab** (HomeStack)
   - HomeScreen (dashboard)
   - Modal: PostRideScreen
   - Modal: SearchRideScreen
   - Modal: DeliverPackageScreen
   - Modal: LocationSelectionScreen

2. **Map Tab**
   - MapScreen (shows rides on map)

3. **MyRides Tab**
   - MyRidesScreen (user's rides/requests)

4. **Profile Tab**
   - ProfileScreen (user profile & settings)

---

## 📱 Screens Status

### ✅ Fully Integrated (Connected to Backend)

1. **LoginScreen** (`app/screens/auth/LoginScreen.js`)
   - Uses `AuthContext.login()`
   - Connected to backend

2. **SignupScreen** (`app/screens/auth/SignupScreen.js`)
   - Uses `AuthContext.register()`
   - Connected to backend

3. **PostRideScreen** (`app/screens/ride/PostRideScreen.js`)
   - Uses `ridesAPI.createRide()`
   - ✅ Connected to backend
   - Allows drivers to post rides with route & schedule

4. **SearchRideScreen** (`app/screens/ride/SearchRideScreen.js`)
   - Uses `ridesAPI.searchRides()` and `ridesAPI.requestRide()`
   - ✅ Connected to backend
   - Passengers can search and request rides

5. **MyRidesScreen** (`app/screens/ride/MyRidesScreen.js`)
   - Uses `ridesAPI.getMyRides()`
   - ✅ Connected to backend
   - Shows user's rides (driver) or requests (passenger)
   - Has tabs: Active, Pending, Completed

### ⚠️ Partially Integrated / Needs Work

6. **MapScreen** (`app/screens/map/MapScreen.js`)
   - ⚠️ Currently uses mock data
   - Should use `ridesAPI.getActiveRides()` to show real rides
   - **TODO**: Connect to backend API

7. **ProfileScreen** (`app/screens/profile/ProfileScreen.js`)
   - Basic UI exists
   - **TODO**: Add profile update functionality

8. **DeliverPackageScreen** (`app/screens/ride/DeliverPackageScreen.js`)
   - UI exists
   - **TODO**: Connect to backend (if package delivery is implemented)

9. **OnboardingScreen** (`app/screens/auth/OnboardingScreen.js`)
   - First-time user introduction
   - No backend integration needed

10. **LocationSelectionScreen** (`app/screens/map/LocationSelectionScreen.js`)
    - Map-based location picker
    - Used by PostRideScreen and SearchRideScreen
    - No backend integration needed

---

## 🔌 API Integration

### API Service (`services/api.js`)
**Status**: ✅ Fully configured

**Features:**
- Axios instance with base URL from `config.js`
- JWT token interceptor (auto-adds token to requests)
- 401 error handler (auto-logout on unauthorized)
- All API endpoints defined

**API Endpoints Available:**

**Authentication:**
```javascript
authAPI.login(email, password)
authAPI.register(userData)
authAPI.logout()
authAPI.getCurrentUser()
```

**Rides:**
```javascript
ridesAPI.createRide(rideData)              // Driver: Post ride
ridesAPI.getMyRides(role)                  // Get user's rides
ridesAPI.searchRides(searchParams)         // Passenger: Search rides
ridesAPI.requestRide(rideId)               // Passenger: Request ride
ridesAPI.getActiveRides()                  // Get all active rides (for map)
ridesAPI.getRideDetails(rideId)            // Get ride details
ridesAPI.acceptRequest(rideId, requestId)  // Driver: Accept request
ridesAPI.rejectRequest(rideId, requestId)  // Driver: Reject request
```

**Matching:**
```javascript
matchingAPI.findMatches(routeData)
matchingAPI.checkOverlap(route1, route2)
```

**Geocoding:**
```javascript
geocodingAPI.geocode(address)
geocodingAPI.reverseGeocode(lat, lng)
```

---

## 🎨 UI Components

### Common Components (`components/common/`)

1. **Button.js** ✅
   - Variants: primary, secondary, outline
   - Loading state support
   - Disabled state

2. **Card.js** ✅
   - Reusable card container
   - Shadow and border styling

3. **Header.js** ✅
   - Screen header with back button
   - Title and optional actions

4. **Input.js** ✅
   - Text input with label
   - Error message support
   - Icon support

5. **SearchBar.js** ✅
   - Search input with placeholder
   - Optional right button

6. **ServiceButton.js** ✅
   - Icon + label button
   - Used in HomeScreen services grid

---

## 🎨 Design System

### Colors (`constants/colors.js`)
- **Primary**: Google Blue (#1A73E8)
- **Secondary**: Google Green (#34A853)
- **Accent**: Orange (#FF9500)
- **Error**: Red (#EA4335)
- **Background**: Light gray (#F2F2F7)
- Full color palette defined

### Configuration (`constants/config.js`)
- **API Base URL**: `http://10.113.209.10:3000/api` (friend's backend)
- **Timeout**: 10 seconds
- **Map Config**: Default location (Bucharest, Romania)
- **Ride Config**: Max seats, price range, matching parameters

---

## 📊 Current Integration Status

### ✅ Completed
- [x] Authentication (Login, Register, Logout)
- [x] Token management (storage, auto-injection, refresh)
- [x] Post Ride (Driver)
- [x] Search Ride (Passenger)
- [x] Request Ride (Passenger)
- [x] My Rides (View rides/requests)
- [x] API service setup
- [x] Error handling (401 auto-logout)

### ⚠️ Pending / Needs Work
- [ ] Map Screen - Connect to backend (use `getActiveRides()`)
- [ ] Profile Screen - Add update functionality
- [ ] Loading states - Improve UX across screens
- [ ] Error messages - Better user feedback
- [ ] Geocoding service - Implement Google Places
- [ ] Form validation - Add comprehensive validation
- [ ] Deliver Package - Connect to backend (if needed)

---

## 🚀 How to Run

### Prerequisites
```bash
# Install dependencies
cd frontend
npm install
```

### Start Development Server
```bash
npm start
# or
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### Environment Setup
- API URL is already configured in `constants/config.js`
- Points to friend's backend: `http://10.113.209.10:3000/api`
- No `.env` file needed for frontend (API config is hardcoded)

---

## 🔧 Development Workflow

### Working with Screens
1. Screens are in `app/screens/`
2. Organized by feature (auth, home, map, ride, profile)
3. Use `useAuth()` hook for authentication
4. Use `ridesAPI`, `authAPI` for backend calls

### Adding New Features
1. Create screen in appropriate folder
2. Add route to `MainNavigator.js` or `AuthNavigator.js`
3. Use existing components from `components/common/`
4. Use API services from `services/api.js`
5. Follow existing code patterns

### Styling
- Use `Colors` from `constants/colors.js`
- Follow existing StyleSheet patterns
- Use consistent spacing and typography

---

## 📝 Important Notes

1. **Backend Connection**: Frontend is configured to use friend's backend at `10.113.209.10:3000`
2. **Token Storage**: JWT tokens stored in AsyncStorage, auto-injected in API calls
3. **Role System**: Users can be driver, passenger, or both (switchable)
4. **Navigation**: Uses React Navigation v7 (Stack + Bottom Tabs)
5. **Error Handling**: 401 errors auto-logout user
6. **Map Integration**: Uses `react-native-maps` for map functionality

---

## 🐛 Known Issues / TODOs

1. **MapScreen** - Needs to fetch real rides from API
2. **ProfileScreen** - Needs update functionality
3. **Geocoding** - Service structure exists but not fully implemented
4. **Form Validation** - Basic validation exists, needs enhancement
5. **Loading States** - Some screens need better loading indicators
6. **Error Messages** - Some screens need better error feedback

---

## 📚 Key Files to Know

- **App.js** - Root component
- **context/AuthContext.js** - Authentication logic
- **services/api.js** - All API calls
- **constants/config.js** - API configuration
- **app/navigation/MainNavigator.js** - Main app navigation
- **app/screens/home/HomeScreen.js** - Main dashboard

---

## 🎯 Next Steps (Priority Order)

1. **Connect MapScreen to Backend** (High Priority)
   - Use `ridesAPI.getActiveRides()` to fetch real rides
   - Display rides on map with markers
   - Show ride details on marker press

2. **Improve Loading States** (Medium Priority)
   - Add loading indicators to all async operations
   - Better UX during API calls

3. **Enhance Error Handling** (Medium Priority)
   - User-friendly error messages
   - Retry logic for failed requests

4. **Profile Screen Updates** (Low Priority)
   - Add profile update functionality
   - Connect to backend API

5. **Geocoding Service** (Low Priority)
   - Implement Google Places autocomplete
   - Add address to coordinates conversion

---

## 💡 Tips

- Always use `useAuth()` hook for authentication state
- Use `ridesAPI` and `authAPI` for backend calls (don't use axios directly)
- Follow existing component patterns for consistency
- Check `FRONTEND_BACKEND_INTEGRATION.md` for integration details
- Check `IMPLEMENTATION_PLAN.md` for future features

---

**You're all set! The frontend is well-structured and mostly integrated. Focus on connecting MapScreen and improving UX! 🚀**

