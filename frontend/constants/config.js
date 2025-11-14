/**
 * App Configuration Constants
 * Environment variables and app-wide configuration
 */

// API Configuration
// Note: For physical devices/emulators, replace 'localhost' with your computer's IP address
// Example: 'http://192.168.1.100:3000/api'
// To find your IP: Windows: ipconfig | findstr IPv4, Mac/Linux: ifconfig | grep inet
export const API_CONFIG = {
  // Base URL for API calls
  // For Android emulator, use: 'http://10.0.2.2:3000/api'
  // For iOS simulator, use: 'http://localhost:3000/api'
  // For physical device, use your computer's IP: 'http://YOUR_IP:3000/api'
  BASE_URL: typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://10.113.209.10:3000/api' // Development - using your computer's IP address
    : 'https://api.yourapp.com/api', // Production

  TIMEOUT: 10000, // 10 seconds
};

// Google Maps API Configuration
export const GOOGLE_MAPS_CONFIG = {
  // Add your Google Maps API key here
  // Get it from: https://console.cloud.google.com/google/maps-apis
  // Enable these APIs: Places API (New), Geocoding API
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCskit7K-AaJaoMryKbLhp0J1zRxq2V3Jc',
  PLACES_AUTOCOMPLETE_URL: 'https://places.googleapis.com/v1/places:autocomplete',
  PLACES_DETAILS_URL: 'https://places.googleapis.com/v1/places',
  GEOCODING_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 44.4268, // Default location (Bucharest, Romania)
  DEFAULT_LONGITUDE: 26.1025,
  DEFAULT_LATITUDE_DELTA: 0.0922,
  DEFAULT_LONGITUDE_DELTA: 0.0421,
  ROUTE_COLOR: '#0066ff',
  ROUTE_WIDTH: 4,
};

// Ride Configuration
export const RIDE_CONFIG = {
  MAX_SEATS: 4,
  MIN_PRICE: 5,
  MAX_PRICE: 100,
  TIME_WINDOW_MINUTES: 30, // ±30 minutes for matching
  MAX_ROUTE_DETOUR_KM: 5, // Maximum detour distance in km
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'NibbleForce Car Share',
  VERSION: '1.0.0',
};

export default {
  API_CONFIG,
  MAP_CONFIG,
  RIDE_CONFIG,
  APP_CONFIG,
};

