# Project Structure

This document outlines the folder structure and organization of the Car Sharing App.

## Directory Structure

```
UniHack2025/
├── app/                          # Main application code
│   ├── components/              # Reusable UI components
│   │   ├── common/             # Common components (Button, Input, Card, etc.)
│   │   ├── map/                # Map-related components
│   │   └── ride/               # Ride-specific components
│   ├── screens/                # Screen components
│   │   ├── auth/               # Authentication screens
│   │   ├── home/               # Home/dashboard screens
│   │   ├── map/                # Map view screens
│   │   ├── ride/               # Ride management screens
│   │   └── profile/            # User profile screens
│   ├── navigation/             # Navigation configuration
│   ├── services/               # API calls and external services
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Helper functions
│   │   ├── validation.js      # Form validation utilities
│   │   └── format.js          # Data formatting utilities
│   ├── constants/              # App constants
│   │   ├── colors.js          # Color palette
│   │   ├── config.js          # App configuration
│   │   └── index.js           # Constants exports
│   ├── context/                # React Context providers
│   ├── index.js                # App entry point
│   └── MainPage.js             # Temporary main page (to be replaced)
├── components/                  # Expo-generated components (legacy)
├── constants/                   # Expo-generated constants (legacy)
├── hooks/                       # Expo-generated hooks (legacy)
├── App.js                       # Root component
├── package.json                 # Dependencies and scripts
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── IMPLEMENTATION_PLAN.md      # Detailed implementation plan
```

## Key Directories

### `/app/components`
Reusable UI components organized by category:
- **common/**: Generic components like buttons, inputs, cards
- **map/**: Map-specific components (MapView, Markers, Routes)
- **ride/**: Ride-related components (RideCard, RideForm)

### `/app/screens`
Full-screen components organized by feature:
- **auth/**: Login, Signup, Onboarding
- **home/**: Main dashboard (role-based)
- **map/**: Map view with route visualization
- **ride/**: Post ride, Search ride, Ride details
- **profile/**: User profile and settings

### `/app/services`
API integration and external services:
- API client setup
- Authentication service
- Ride service
- Matching service
- Geocoding service

### `/app/utils`
Helper functions:
- **validation.js**: Form validation utilities
- **format.js**: Data formatting (dates, prices, distances)

### `/app/constants`
App-wide constants:
- **colors.js**: Color palette for theming
- **config.js**: Configuration (API URLs, map settings, etc.)

### `/app/context`
React Context providers for global state:
- AuthContext (authentication state)
- UserContext (user data)
- ThemeContext (if needed)

### `/app/hooks`
Custom React hooks:
- useAuth
- useLocation
- useRides
- etc.

## Naming Conventions

- **Components**: PascalCase (e.g., `Button.js`, `RideCard.js`)
- **Screens**: PascalCase with "Screen" suffix (e.g., `HomeScreen.js`)
- **Utilities**: camelCase (e.g., `validation.js`, `format.js`)
- **Constants**: UPPER_SNAKE_CASE for values, camelCase for files
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.js`)

## File Organization

- Each component/screen should be in its own file
- Related files can be grouped in folders
- Use `index.js` files for clean imports
- Keep components small and focused (single responsibility)

## Import Paths

Use relative paths for now. Consider setting up path aliases later:
```javascript
// Example imports
import { Colors } from '../constants';
import { Button } from '../components/common';
import { formatPrice } from '../utils';
```

## Next Steps

1. Install dependencies: `npm install`
2. Start implementing Phase 2: Authentication
3. Build out common components
4. Set up navigation structure

