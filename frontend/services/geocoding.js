/**
 * Geocoding Service
 * Handles address to coordinates conversion and vice versa
 * Uses Google Places Autocomplete API and Geocoding API
 */
import { GOOGLE_MAPS_CONFIG } from '../constants/config';
import axios from 'axios';

/**
 * Convert address to coordinates using Google Geocoding API
 * @param {string} address - Address string
 * @param {number} centerLat - Optional center latitude for biasing
 * @param {number} centerLon - Optional center longitude for biasing
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const geocodeAddress = async (address, centerLat = null, centerLon = null) => {
    try {
        const params = {
            address: address,
            key: GOOGLE_MAPS_CONFIG.API_KEY,
        };

        // Add location bias if center coordinates provided
        if (centerLat && centerLon) {
            params.location = `${centerLat},${centerLon}`;
            params.radius = 10000; // 10km radius
        }

        const response = await axios.get(GOOGLE_MAPS_CONFIG.GEOCODING_URL, { params });

        if (response.data?.results?.[0]) {
            const result = response.data.results[0];
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                address: result.formatted_address,
            };
        }

        throw new Error('No results found');
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw error;
    }
};

/**
 * Convert coordinates to address using Google Geocoding API
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} - Address string
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await axios.get(GOOGLE_MAPS_CONFIG.GEOCODING_URL, {
            params: {
                latlng: `${latitude},${longitude}`,
                key: GOOGLE_MAPS_CONFIG.API_KEY,
                language: 'en',
            },
        });

        if (response.data?.results?.[0]) {
            return response.data.results[0].formatted_address;
        }
        
        // Fallback if no results
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        // Fallback on error
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
};

/**
 * Search for address suggestions using Google Places Autocomplete API
 * @param {string} query - Search query
 * @param {number} latitude - Center latitude for radius filtering
 * @param {number} longitude - Center longitude for radius filtering
 * @param {number} radiusKm - Radius in kilometers (default 10km)
 * @returns {Promise<Array<{address: string, latitude: number, longitude: number, placeId: string}>>}
 */
export const searchAddressSuggestions = async (query, latitude, longitude, radiusKm = 10) => {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        // Convert radius from km to meters
        const radiusMeters = radiusKm * 1000;

        const response = await axios.post(
            GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL,
            {
                input: query,
                locationBias: {
                    circle: {
                        center: {
                            latitude: latitude,
                            longitude: longitude,
                        },
                        radius: radiusMeters,
                    },
                },
                includedPrimaryTypes: ['street_address', 'route', 'establishment', 'point_of_interest'],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_CONFIG.API_KEY,
                    'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
                },
            }
        );

        const suggestions = [];
        if (response.data?.suggestions) {
            // Process suggestions in parallel for better performance
            const suggestionPromises = response.data.suggestions
                .filter(s => s.placePrediction)
                .slice(0, 5) // Limit to 5 to reduce API calls
                .map(async (suggestion) => {
                    const prediction = suggestion.placePrediction;
                    // Extract place ID
                    const placeId = prediction.place?.replace('places/', '') || prediction.placeId;
                    
                    if (placeId) {
                        try {
                            const placeDetails = await getPlaceDetails(placeId);
                            if (placeDetails) {
                                return {
                                    address: prediction.text?.text || prediction.structuredFormat?.mainText?.text || '',
                                    fullAddress: prediction.structuredFormat?.secondaryText?.text || '',
                                    latitude: placeDetails.latitude,
                                    longitude: placeDetails.longitude,
                                    placeId: placeId,
                                };
                            }
                        } catch (error) {
                            console.error('Error getting place details:', error);
                        }
                    }
                    return null;
                });

            const results = await Promise.all(suggestionPromises);
            suggestions.push(...results.filter(r => r !== null));
        }

        return suggestions.slice(0, 5); // Return max 5 suggestions
    } catch (error) {
        console.error('Error fetching address suggestions:', error);
        // Fallback to empty array on error
        return [];
    }
};

/**
 * Get place details including coordinates from place ID using Place Details (New) API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<{latitude: number, longitude: number, address: string} | null>}
 */
const getPlaceDetails = async (placeId) => {
    try {
        // Use Geocoding API with place_id (simpler and works reliably)
        const response = await axios.get(GOOGLE_MAPS_CONFIG.GEOCODING_URL, {
            params: {
                place_id: placeId,
                key: GOOGLE_MAPS_CONFIG.API_KEY,
            },
        });

        if (response.data?.results?.[0]) {
            const result = response.data.results[0];
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                address: result.formatted_address,
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting place details:', error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

