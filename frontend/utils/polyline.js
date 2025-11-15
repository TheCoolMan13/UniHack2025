/**
 * Polyline Decoder
 * Decodes Google Maps polyline strings to coordinate arrays
 * Based on the encoded polyline algorithm format
 */

// Maximum number of coordinates to prevent iOS crashes
const MAX_COORDINATES = 500;

/**
 * Simplify polyline by reducing coordinates (takes every Nth point)
 * @param {Array} coordinates - Array of coordinate objects
 * @param {number} maxPoints - Maximum number of points to keep
 * @returns {Array} Simplified coordinate array
 */
const simplifyPolyline = (coordinates, maxPoints = MAX_COORDINATES) => {
    if (!coordinates || coordinates.length === 0) return [];
    if (coordinates.length <= maxPoints) return coordinates;
    
    // Always keep first and last point
    const simplified = [coordinates[0]];
    const step = Math.ceil((coordinates.length - 2) / (maxPoints - 2));
    
    for (let i = step; i < coordinates.length - 1; i += step) {
        simplified.push(coordinates[i]);
    }
    
    // Always include last point
    if (coordinates.length > 1) {
        simplified.push(coordinates[coordinates.length - 1]);
    }
    
    return simplified;
};

/**
 * Decode a polyline string to an array of coordinates
 * @param {string} encoded - Encoded polyline string
 * @param {boolean} simplify - Whether to simplify the polyline (default: true)
 * @returns {Array} Array of {latitude, longitude} objects
 */
export const decodePolyline = (encoded, simplify = true) => {
    if (!encoded || typeof encoded !== 'string') return [];
    
    try {
        const poly = [];
        let index = 0;
        const len = encoded.length;
        let lat = 0;
        let lng = 0;

        while (index < len) {
            let b;
            let shift = 0;
            let result = 0;
            do {
                if (index >= len) break;
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                if (index >= len) break;
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            // Validate coordinates
            const latitude = lat * 1e-5;
            const longitude = lng * 1e-5;
            
            if (isNaN(latitude) || isNaN(longitude) || 
                latitude < -90 || latitude > 90 || 
                longitude < -180 || longitude > 180) {
                console.warn('Invalid coordinate in polyline, skipping');
                continue;
            }

            poly.push({
                latitude,
                longitude,
            });
        }

        // Simplify if requested and needed
        if (simplify && poly.length > MAX_COORDINATES) {
            return simplifyPolyline(poly, MAX_COORDINATES);
        }

        return poly;
    } catch (error) {
        console.error('Error decoding polyline:', error);
        return [];
    }
};

