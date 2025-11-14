import { calculateDistance } from "./geocoding";

/**
 * Route Matching Service
 * Implements algorithm to match passenger routes with driver routes
 */

/**
 * Check if a point is on/near a route
 * @param {Object} point - {latitude, longitude}
 * @param {Object} routeStart - {latitude, longitude}
 * @param {Object} routeEnd - {latitude, longitude}
 * @param {number} threshold - Maximum distance in km (default: 2km)
 * @returns {boolean}
 */
const isPointOnRoute = (point, routeStart, routeEnd, threshold = 2) => {
    // Calculate distance from point to route line
    const distance = distanceToLineSegment(
        point,
        routeStart,
        routeEnd
    );
    return distance <= threshold;
};

/**
 * Calculate distance from a point to a line segment
 * Uses perpendicular distance calculation
 */
const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.latitude - lineStart.latitude;
    const B = point.longitude - lineStart.longitude;
    const C = lineEnd.latitude - lineStart.latitude;
    const D = lineEnd.longitude - lineStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = lineStart.latitude;
        yy = lineStart.longitude;
    } else if (param > 1) {
        xx = lineEnd.latitude;
        yy = lineEnd.longitude;
    } else {
        xx = lineStart.latitude + param * C;
        yy = lineStart.longitude + param * D;
    }

    const dx = point.latitude - xx;
    const dy = point.longitude - yy;
    return Math.sqrt(dx * dx + dy * dy) * 111; // Convert to km (rough approximation)
};

/**
 * Check if time windows overlap
 * @param {string} time1 - Time string (e.g., "7:30 AM")
 * @param {string} time2 - Time string (e.g., "7:45 AM")
 * @param {number} window - Time window in minutes (default: 30)
 * @returns {boolean}
 */
const isTimeMatch = (time1, time2, window = 30) => {
    const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let totalMinutes = hours * 60 + minutes;
        if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
        if (period === "AM" && hours === 12) totalMinutes -= 12 * 60;
        return totalMinutes;
    };

    const minutes1 = parseTime(time1);
    const minutes2 = parseTime(time2);
    return Math.abs(minutes1 - minutes2) <= window;
};

/**
 * Check if days overlap
 * @param {Array<string>} days1 - Array of day names
 * @param {Array<string>} days2 - Array of day names
 * @returns {boolean}
 */
const isDayMatch = (days1, days2) => {
    return days1.some((day) => days2.includes(day));
};

/**
 * Match passenger route with driver routes
 * @param {Object} passengerRoute - {pickupLocation, dropoffLocation, schedule: {days, time}}
 * @param {Array<Object>} driverRoutes - Array of driver routes
 * @returns {Array<Object>} - Array of matched routes with match score
 */
export const findMatchingRides = (passengerRoute, driverRoutes) => {
    const matches = [];

    driverRoutes.forEach((driverRoute) => {
        let matchScore = 0;
        const reasons = [];

        // Check if passenger pickup is on driver route
        const pickupOnRoute = isPointOnRoute(
            passengerRoute.pickupLocation,
            driverRoute.pickupLocation,
            driverRoute.dropoffLocation
        );

        // Check if passenger dropoff is on driver route
        const dropoffOnRoute = isPointOnRoute(
            passengerRoute.dropoffLocation,
            driverRoute.pickupLocation,
            driverRoute.dropoffLocation
        );

        // Check time match
        const timeMatch = isTimeMatch(
            passengerRoute.schedule.time,
            driverRoute.schedule.time
        );

        // Check day match
        const dayMatch = isDayMatch(
            passengerRoute.schedule.days,
            driverRoute.schedule.days
        );

        // Calculate match score
        if (pickupOnRoute) {
            matchScore += 30;
            reasons.push("Pickup on route");
        }
        if (dropoffOnRoute) {
            matchScore += 30;
            reasons.push("Dropoff on route");
        }
        if (timeMatch) {
            matchScore += 25;
            reasons.push("Time matches");
        }
        if (dayMatch) {
            matchScore += 15;
            reasons.push("Days match");
        }

        // Only include if there's a meaningful match
        if (matchScore >= 30) {
            matches.push({
                ...driverRoute,
                matchScore,
                reasons,
            });
        }
    });

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Calculate route overlap percentage
 * @param {Object} route1 - {pickupLocation, dropoffLocation}
 * @param {Object} route2 - {pickupLocation, dropoffLocation}
 * @returns {number} - Overlap percentage (0-100)
 */
export const calculateRouteOverlap = (route1, route2) => {
    // Simplified overlap calculation
    // In production, use actual route polyline from Google Maps Directions API
    
    const distance1 = calculateDistance(
        route1.pickupLocation.latitude,
        route1.pickupLocation.longitude,
        route1.dropoffLocation.latitude,
        route1.dropoffLocation.longitude
    );

    const distance2 = calculateDistance(
        route2.pickupLocation.latitude,
        route2.pickupLocation.longitude,
        route2.dropoffLocation.latitude,
        route2.dropoffLocation.longitude
    );

    // Check if routes share common points
    const pickupMatch = isPointOnRoute(route1.pickupLocation, route2.pickupLocation, route2.dropoffLocation, 1);
    const dropoffMatch = isPointOnRoute(route1.dropoffLocation, route2.pickupLocation, route2.dropoffLocation, 1);

    if (pickupMatch && dropoffMatch) {
        return 100; // Perfect match
    } else if (pickupMatch || dropoffMatch) {
        return 50; // Partial match
    }

    return 0;
};

