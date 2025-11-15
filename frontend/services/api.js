import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../constants/config";

/**
 * API Service
 * Handles all API calls to the backend
 */

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            // Get token from AsyncStorage and add to headers
            const token = await AsyncStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Error getting token from storage:", error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
            // Unauthorized - clear token and user data
            try {
                await AsyncStorage.removeItem("token");
                await AsyncStorage.removeItem("user");
                await AsyncStorage.removeItem("currentRole");
            } catch (storageError) {
                console.error("Error clearing storage:", storageError);
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Authentication API
 */
export const authAPI = {
    login: (email, password) => api.post("/auth/login", { email, password }),
    register: (userData) => api.post("/auth/register", userData),
    logout: () => api.post("/auth/logout"),
    getCurrentUser: () => api.get("/auth/me"),
    updateProfile: (profileData) => api.put("/auth/profile", profileData),
};

/**
 * Rides API
 */
export const ridesAPI = {
    // Driver endpoints
    createRide: (rideData) => api.post("/rides", rideData),
    getMyRides: (role) => api.get(`/rides?role=${role}`),
    updateRide: (rideId, updates) => api.put(`/rides/${rideId}`, updates),
    deleteRide: (rideId) => api.delete(`/rides/${rideId}`),
    
    // Passenger endpoints
    searchRides: (searchParams) => api.post("/rides/search", searchParams),
    requestRide: (rideId, passengerLocations) => api.post(`/rides/${rideId}/request`, passengerLocations),
    
    // Common endpoints
    getActiveRides: () => api.get("/rides/active"), // Get all active rides for map
    getRideDetails: (rideId) => api.get(`/rides/${rideId}`),
    acceptRequest: (rideId, requestId) => api.post(`/rides/${rideId}/accept`, { request_id: requestId }),
    rejectRequest: (rideId, requestId) => api.post(`/rides/${rideId}/reject`, { request_id: requestId }),
    cancelRequest: (rideId, requestId) => api.post(`/rides/${rideId}/cancel`, { request_id: requestId }),
};

/**
 * Driver Requests API (Looking for Riders)
 */
export const driverRequestsAPI = {
    // Driver endpoints
    createDriverRequest: (requestData) => api.post("/driver-requests", requestData),
    getMyDriverRequests: () => api.get("/driver-requests"),
    cancelDriverRequest: (requestId) => api.delete(`/driver-requests/${requestId}`),
    acceptResponse: (requestId, responseId) => api.post(`/driver-requests/${requestId}/accept-response`, { response_id: responseId }),
    rejectResponse: (requestId, responseId) => api.post(`/driver-requests/${requestId}/reject-response`, { response_id: responseId }),
    
    // Passenger endpoints
    searchDriverRequests: (searchParams) => api.post("/driver-requests/search", searchParams),
    respondToDriverRequest: (requestId, responseData) => api.post(`/driver-requests/${requestId}/respond`, responseData),
};

/**
 * Matching API
 */
export const matchingAPI = {
    findMatches: (routeData) => api.post("/matching/search", routeData),
    checkOverlap: (route1, route2) => api.post("/matching/overlap", { route1, route2 }),
};

/**
 * Geocoding API
 */
export const geocodingAPI = {
    geocode: (address) => api.get(`/geocoding/geocode?address=${encodeURIComponent(address)}`),
    reverseGeocode: (lat, lng) => api.get(`/geocoding/reverse?lat=${lat}&lng=${lng}`),
};

/**
 * Routes API
 */
export const routesAPI = {
    calculateRoute: (origin, destination) => api.post("/routes/calculate", { origin, destination }),
    calculateRouteWithWaypoints: (origin, waypoints, destination) => 
        api.post("/routes/calculate-with-waypoints", { origin, waypoints, destination }),
};

/**
 * Rider Searches API (Saved Searches for Future Matches)
 */
export const riderSearchesAPI = {
    saveSearch: (searchParams) => api.post("/rider-searches", searchParams),
    getMySavedSearches: () => api.get("/rider-searches"),
    updateSavedSearch: (searchId, searchParams) => api.put(`/rider-searches/${searchId}`, searchParams),
    cancelSavedSearch: (searchId) => api.delete(`/rider-searches/${searchId}`),
    getNewMatches: () => api.get("/rider-searches/matches/new"),
    markMatchViewed: (matchId) => api.put(`/rider-searches/matches/${matchId}/viewed`),
    dismissMatch: (matchId) => api.put(`/rider-searches/matches/${matchId}/dismiss`),
};

export default api;

