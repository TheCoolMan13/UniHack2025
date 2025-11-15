import * as Location from "expo-location";
import React, { useEffect, useState, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Card from "../../../components/common/Card";
import Header from "../../../components/common/Header";
import { Colors } from "../../../constants/colors";
import { ridesAPI, routesAPI } from "../../../services/api";
import { MAP_CONFIG } from "../../../constants/config";
import { useAuth } from "../../../context/AuthContext";
import { decodePolyline } from "../../../utils/polyline";

/**
 * Map Screen
 * Displays map with user location and available rides
 */

const MapScreen = () => {
    const { user } = useAuth();
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null); // Start with null, will be set when location is available
    const [hasPermission, setHasPermission] = useState(false);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRide, setSelectedRide] = useState(null);
    const markerPressRef = useRef(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [rideRoutes, setRideRoutes] = useState({}); // Store routes: { 'rideType-rideId': { polyline: '...', coordinates: [...] } }
    const [requestRoutes, setRequestRoutes] = useState({}); // Store request routes: { 'rideId-requestId': { polyline: '...', coordinates: [...] } }

    useEffect(() => {
        requestLocationPermission();
        fetchActiveRides();
    }, []);

    // Center map on location when it becomes available
    useEffect(() => {
        if (location && mapRef.current && region) {
            // Small delay to ensure map is rendered
            setTimeout(() => {
                mapRef.current?.animateToRegion(region, 1000);
            }, 100);
        }
    }, [location, region]);

    /**
     * Fetch user's rides (both offered as driver and requested as passenger)
     */
    const fetchActiveRides = async () => {
        try {
            setLoading(true);
            const allRides = [];
            
            // Fetch rides where user is the driver (offered rides)
            try {
                const driverResponse = await ridesAPI.getMyRides('driver');
                if (driverResponse.data.success) {
                    const driverRides = (driverResponse.data.data.rides || []).map(ride => ({
                        ...ride,
                        rideType: 'offered', // User offered this ride as driver
                        // Include accepted_requests and pending_requests from API response
                        accepted_requests: ride.accepted_requests || [],
                        pending_requests: ride.pending_requests || [],
                    }));
                    allRides.push(...driverRides);
                }
            } catch (error) {
                console.error("Error fetching driver rides:", error);
            }
            
            // Fetch rides where user is the passenger (requested rides)
            try {
                const passengerResponse = await ridesAPI.getMyRides('passenger');
                if (passengerResponse.data.success) {
                    const passengerRides = (passengerResponse.data.data.rides || []).map(ride => ({
                        ...ride,
                        rideType: 'requested', // User requested this ride as passenger
                    }));
                    allRides.push(...passengerRides);
                }
            } catch (error) {
                console.error("Error fetching passenger rides:", error);
            }
            
            setRides(allRides);
            
            // Fetch routes for all rides
            fetchRoutesForRides(allRides);
        } catch (error) {
            console.error("Fetch user rides error:", error);
            setRides([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch actual routes for all rides using Google Maps Directions API
     */
    const fetchRoutesForRides = async (ridesList) => {
        const routes = {};
        const reqRoutes = {};
        
        // Fetch routes for each ride
        const routePromises = ridesList.map(async (ride) => {
            if (!ride.pickup_latitude || !ride.pickup_longitude || 
                !ride.dropoff_latitude || !ride.dropoff_longitude) {
                return;
            }
            
            try {
                const origin = {
                    latitude: parseFloat(ride.pickup_latitude),
                    longitude: parseFloat(ride.pickup_longitude),
                };
                const destination = {
                    latitude: parseFloat(ride.dropoff_latitude),
                    longitude: parseFloat(ride.dropoff_longitude),
                };
                
                const routeKey = `${ride.rideType}-${ride.id}`;
                const response = await routesAPI.calculateRoute(origin, destination);
                
                if (response.data.success && response.data.data.route) {
                    const route = response.data.data.route;
                    if (route.polyline) {
                        routes[routeKey] = {
                            polyline: route.polyline,
                            coordinates: decodePolyline(route.polyline),
                        };
                    }
                }
            } catch (error) {
                console.error(`Error fetching route for ride ${ride.id}:`, error);
            }
        });
        
        // Fetch routes for accepted and pending requests
        const requestRoutePromises = [];
        
        ridesList.forEach((ride) => {
            if (ride.rideType === 'offered' && ride.accepted_requests) {
                ride.accepted_requests.forEach((request) => {
                    if (request.pickup_latitude && request.pickup_longitude && 
                        request.dropoff_latitude && request.dropoff_longitude) {
                        const promise = (async () => {
                            try {
                                const origin = {
                                    latitude: parseFloat(request.pickup_latitude),
                                    longitude: parseFloat(request.pickup_longitude),
                                };
                                const destination = {
                                    latitude: parseFloat(request.dropoff_latitude),
                                    longitude: parseFloat(request.dropoff_longitude),
                                };
                                
                                const routeKey = `${ride.id}-${request.id}-accepted`;
                                const response = await routesAPI.calculateRoute(origin, destination);
                                
                                if (response.data.success && response.data.data.route) {
                                    const route = response.data.data.route;
                                    if (route.polyline) {
                                        reqRoutes[routeKey] = {
                                            polyline: route.polyline,
                                            coordinates: decodePolyline(route.polyline),
                                        };
                                    }
                                }
                            } catch (error) {
                                console.error(`Error fetching route for accepted request ${request.id}:`, error);
                            }
                        })();
                        requestRoutePromises.push(promise);
                    }
                });
            }
            
            if (ride.rideType === 'offered' && ride.pending_requests) {
                ride.pending_requests.forEach((request) => {
                    if (request.pickup_latitude && request.pickup_longitude && 
                        request.dropoff_latitude && request.dropoff_longitude) {
                        const promise = (async () => {
                            try {
                                const origin = {
                                    latitude: parseFloat(request.pickup_latitude),
                                    longitude: parseFloat(request.pickup_longitude),
                                };
                                const destination = {
                                    latitude: parseFloat(request.dropoff_latitude),
                                    longitude: parseFloat(request.dropoff_longitude),
                                };
                                
                                const routeKey = `${ride.id}-${request.id}-pending`;
                                const response = await routesAPI.calculateRoute(origin, destination);
                                
                                if (response.data.success && response.data.data.route) {
                                    const route = response.data.data.route;
                                    if (route.polyline) {
                                        reqRoutes[routeKey] = {
                                            polyline: route.polyline,
                                            coordinates: decodePolyline(route.polyline),
                                        };
                                    }
                                }
                            } catch (error) {
                                console.error(`Error fetching route for pending request ${request.id}:`, error);
                            }
                        })();
                        requestRoutePromises.push(promise);
                    }
                });
            }
        });
        
        await Promise.all([...routePromises, ...requestRoutePromises]);
        setRideRoutes(routes);
        setRequestRoutes(reqRoutes);
    };

    /**
     * Request location permissions and get current location
     */
    const requestLocationPermission = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required to use the map feature."
                );
                setHasPermission(false);
                // Fallback to default location if permission denied
                setRegion({
                    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
                    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
                    latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
                    longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
                });
                setLocationLoading(false);
                return;
            }

            setHasPermission(true);
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = currentLocation.coords;

            const newRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };

            setLocation({ latitude, longitude });
            setRegion(newRegion);
            
            // Animate map to user location once it's available
            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
        } catch (error) {
            console.error("Error getting location:", error);
            Alert.alert("Error", "Failed to get your location.");
            // Fallback to default location on error
            setRegion({
                latitude: MAP_CONFIG.DEFAULT_LATITUDE,
                longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
                latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
                longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
            });
        } finally {
            setLocationLoading(false);
        }
    };

    /**
     * Center map on user's current location
     */
    const centerOnUser = async () => {
        if (hasPermission && location) {
            const newRegion = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            setRegion(newRegion);
            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
        } else {
            await requestLocationPermission();
        }
    };

    /**
     * Handle marker or polyline press to show ride details
     */
    const handleRidePress = (ride) => {
        if (!ride || !ride.id) {
            return; // Safety check
        }
        
        // Set flag to prevent MapView onPress from firing
        markerPressRef.current = true;
        
        // If clicking the same ride, deselect it
        if (selectedRide && selectedRide.id === ride.id && selectedRide.rideType === ride.rideType) {
            setSelectedRide(null);
        } else {
            // Create a copy to avoid reference issues
            setSelectedRide({ ...ride });
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
            markerPressRef.current = false;
        }, 100);
    };

    // Show loading indicator while getting location
    if (locationLoading && !region) {
        return (
            <View style={styles.container}>
                <Header title="Map" showBack={false} showStatusBar={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
            </View>
        );
    }

    // Show "Not available" message on iOS devices
    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <Header title="Map" showBack={false} showStatusBar={true} />
                <View style={styles.unavailableContainer}>
                    <Text style={styles.unavailableText}>Not available on all iOS devices</Text>
                </View>
            </View>
        );
    }

    // Fallback region if location is not available
    const mapRegion = region || {
        latitude: MAP_CONFIG.DEFAULT_LATITUDE,
        longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
        latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
        longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
    };

    return (
        <View style={styles.container}>
            <Header title="Map" showBack={false} showStatusBar={true} />
            <MapView
                ref={mapRef}
                provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setRegion}
                showsUserLocation={hasPermission}
                showsMyLocationButton={false}
                onPress={() => {
                    // Only deselect if the press didn't come from a marker/polyline
                    if (!markerPressRef.current && selectedRide) {
                        setSelectedRide(null);
                    }
                }}
                initialRegion={mapRegion}
                mapType="standard"
                loadingEnabled={true}
                loadingIndicatorColor={Colors.primary}
                loadingBackgroundColor={Colors.background}
            >
                {/* User location marker */}
                {location && location.latitude && location.longitude && (
                    <Marker
                        coordinate={{
                            latitude: Number(parseFloat(location.latitude) || 0),
                            longitude: Number(parseFloat(location.longitude) || 0),
                        }}
                        title="Your Location"
                        pinColor={Colors.primary}
                    />
                )}

                {/* User's ride markers - only show selected ride if one is selected, otherwise show all */}
                {(() => {
                    // Filter rides: show only selected ride if one is selected, otherwise show all
                    const ridesToShow = selectedRide 
                        ? rides.filter(r => r && r.id && selectedRide && selectedRide.id && r.id === selectedRide.id && r.rideType === selectedRide.rideType)
                        : rides;
                    
                    const markers = [];
                    
                    ridesToShow
                        .filter(ride => ride && ride.pickup_latitude && ride.pickup_longitude && ride.dropoff_latitude && ride.dropoff_longitude)
                        .forEach((ride) => {
                        
                        // Parse coordinates as floats and validate
                        const pickupLat = parseFloat(ride.pickup_latitude);
                        const pickupLng = parseFloat(ride.pickup_longitude);
                        const dropoffLat = parseFloat(ride.dropoff_latitude);
                        const dropoffLng = parseFloat(ride.dropoff_longitude);
                        
                        // Skip if coordinates are invalid
                        if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropoffLat) || isNaN(dropoffLng)) {
                            console.warn('Invalid coordinates for ride:', ride.id);
                            return;
                        }
                        
                        const pickupCoord = {
                            latitude: pickupLat,
                            longitude: pickupLng,
                        };
                        const dropoffCoord = {
                            latitude: dropoffLat,
                            longitude: dropoffLng,
                        };

                        // Different colors for offered vs requested rides
                        const isOffered = ride.rideType === 'offered';
                        const isSelected = selectedRide && selectedRide.id === ride.id && selectedRide.rideType === ride.rideType;
                        
                        // Highlight selected ride with brighter colors and thicker line
                        const pickupColor = isSelected 
                            ? (isOffered ? '#0066FF' : '#00CC66') 
                            : (isOffered ? Colors.primary : Colors.secondary);
                        const dropoffColor = isSelected 
                            ? (isOffered ? '#0052CC' : '#00AA44') 
                            : (isOffered ? '#0066CC' : '#00AA44');
                        const routeColor = isSelected 
                            ? (isOffered ? '#0066FF' : '#00CC66') 
                            : (isOffered ? Colors.primary : Colors.secondary);
                        const routeWidth = isSelected ? MAP_CONFIG.ROUTE_WIDTH * 2 : MAP_CONFIG.ROUTE_WIDTH;

                        // Add ride markers - ensure coordinates are numbers for iOS
                        const safePickupCoord = {
                            latitude: Number(pickupCoord.latitude),
                            longitude: Number(pickupCoord.longitude),
                        };
                        const safeDropoffCoord = {
                            latitude: Number(dropoffCoord.latitude),
                            longitude: Number(dropoffCoord.longitude),
                        };
                        
                        // Get actual route if available, otherwise use straight line
                        const routeKey = `${ride.rideType}-${ride.id}`;
                        const routeData = rideRoutes[routeKey];
                        let routeCoordinates = routeData?.coordinates || [safePickupCoord, safeDropoffCoord];
                        
                        // Validate and limit coordinates for iOS safety
                        if (Array.isArray(routeCoordinates) && routeCoordinates.length > 0) {
                            routeCoordinates = routeCoordinates
                                .filter(coord => {
                                    const lat = Number(coord.latitude);
                                    const lng = Number(coord.longitude);
                                    return !isNaN(lat) && !isNaN(lng) && 
                                           lat >= -90 && lat <= 90 && 
                                           lng >= -180 && lng <= 180;
                                })
                                .slice(0, 500) // Limit to 500 coordinates max
                                .map(coord => ({
                                    latitude: Number(coord.latitude),
                                    longitude: Number(coord.longitude),
                                }));
                            
                            // Ensure we have at least 2 points
                            if (routeCoordinates.length < 2) {
                                routeCoordinates = [safePickupCoord, safeDropoffCoord];
                            }
                        } else {
                            routeCoordinates = [safePickupCoord, safeDropoffCoord];
                        }
                        
                        markers.push(
                            <Marker
                                key={`ride-${ride.rideType}-${ride.id}-pickup`}
                                coordinate={safePickupCoord}
                                pinColor={pickupColor}
                                onPress={() => handleRidePress(ride)}
                            />,
                            <Marker
                                key={`ride-${ride.rideType}-${ride.id}-dropoff`}
                                coordinate={safeDropoffCoord}
                                pinColor={dropoffColor}
                                onPress={() => handleRidePress(ride)}
                            />,
                            <Polyline
                                key={`ride-${ride.rideType}-${ride.id}-route`}
                                coordinates={routeCoordinates}
                                strokeColor={routeColor}
                                strokeWidth={Number(routeWidth)}
                                tappable={true}
                                onPress={() => handleRidePress(ride)}
                                lineDashPattern={routeData ? undefined : [5, 5]} // Dashed if no route data
                            />
                        );
                        
                        // If this is an offered ride, show accepted and pending riders
                        if (isOffered && ride.accepted_requests) {
                            ride.accepted_requests.forEach((request, idx) => {
                                if (request.pickup_latitude && request.pickup_longitude && 
                                    request.dropoff_latitude && request.dropoff_longitude) {
                                    const reqPickupLat = parseFloat(request.pickup_latitude);
                                    const reqPickupLng = parseFloat(request.pickup_longitude);
                                    const reqDropoffLat = parseFloat(request.dropoff_latitude);
                                    const reqDropoffLng = parseFloat(request.dropoff_longitude);
                                    
                                    if (!isNaN(reqPickupLat) && !isNaN(reqPickupLng) && 
                                        !isNaN(reqDropoffLat) && !isNaN(reqDropoffLng)) {
                                        const safeReqPickup = {
                                            latitude: Number(reqPickupLat),
                                            longitude: Number(reqPickupLng),
                                        };
                                        const safeReqDropoff = {
                                            latitude: Number(reqDropoffLat),
                                            longitude: Number(reqDropoffLng),
                                        };
                                        
                                        // Get actual route if available
                                        const reqRouteKey = `${ride.id}-${request.id}-accepted`;
                                        const reqRouteData = requestRoutes[reqRouteKey];
                                        let reqRouteCoordinates = reqRouteData?.coordinates || [safeReqPickup, safeReqDropoff];
                                        
                                        // Validate and limit coordinates
                                        if (Array.isArray(reqRouteCoordinates) && reqRouteCoordinates.length > 0) {
                                            reqRouteCoordinates = reqRouteCoordinates
                                                .filter(coord => {
                                                    const lat = Number(coord.latitude);
                                                    const lng = Number(coord.longitude);
                                                    return !isNaN(lat) && !isNaN(lng) && 
                                                           lat >= -90 && lat <= 90 && 
                                                           lng >= -180 && lng <= 180;
                                                })
                                                .slice(0, 500)
                                                .map(coord => ({
                                                    latitude: Number(coord.latitude),
                                                    longitude: Number(coord.longitude),
                                                }));
                                            
                                            if (reqRouteCoordinates.length < 2) {
                                                reqRouteCoordinates = [safeReqPickup, safeReqDropoff];
                                            }
                                        } else {
                                            reqRouteCoordinates = [safeReqPickup, safeReqDropoff];
                                        }
                                        
                                        markers.push(
                                            <Marker
                                                key={`accepted-${ride.id}-${request.id}-pickup`}
                                                coordinate={safeReqPickup}
                                                pinColor="#00AA44"
                                                title={`${request.passenger_name || 'Passenger'} - Pickup`}
                                                onPress={() => handleRidePress(ride)}
                                            />,
                                            <Marker
                                                key={`accepted-${ride.id}-${request.id}-dropoff`}
                                                coordinate={safeReqDropoff}
                                                pinColor="#00CC66"
                                                title={`${request.passenger_name || 'Passenger'} - Dropoff`}
                                                onPress={() => handleRidePress(ride)}
                                            />,
                                            <Polyline
                                                key={`accepted-${ride.id}-${request.id}-route`}
                                                coordinates={reqRouteCoordinates}
                                                strokeColor="#00AA44"
                                                strokeWidth={2}
                                                lineDashPattern={reqRouteData ? undefined : [5, 5]}
                                                tappable={true}
                                                onPress={() => handleRidePress(ride)}
                                            />
                                        );
                                    }
                                }
                            });
                        }
                        
                        // Show pending requests for offered rides
                        if (isOffered && ride.pending_requests) {
                            ride.pending_requests.forEach((request, idx) => {
                                if (request.pickup_latitude && request.pickup_longitude && 
                                    request.dropoff_latitude && request.dropoff_longitude) {
                                    const reqPickupLat = parseFloat(request.pickup_latitude);
                                    const reqPickupLng = parseFloat(request.pickup_longitude);
                                    const reqDropoffLat = parseFloat(request.dropoff_latitude);
                                    const reqDropoffLng = parseFloat(request.dropoff_longitude);
                                    
                                    if (!isNaN(reqPickupLat) && !isNaN(reqPickupLng) && 
                                        !isNaN(reqDropoffLat) && !isNaN(reqDropoffLng)) {
                                        const safeReqPickup = {
                                            latitude: Number(reqPickupLat),
                                            longitude: Number(reqPickupLng),
                                        };
                                        const safeReqDropoff = {
                                            latitude: Number(reqDropoffLat),
                                            longitude: Number(reqDropoffLng),
                                        };
                                        
                                        // Get actual route if available
                                        const reqRouteKey = `${ride.id}-${request.id}-pending`;
                                        const reqRouteData = requestRoutes[reqRouteKey];
                                        let reqRouteCoordinates = reqRouteData?.coordinates || [safeReqPickup, safeReqDropoff];
                                        
                                        // Validate and limit coordinates
                                        if (Array.isArray(reqRouteCoordinates) && reqRouteCoordinates.length > 0) {
                                            reqRouteCoordinates = reqRouteCoordinates
                                                .filter(coord => {
                                                    const lat = Number(coord.latitude);
                                                    const lng = Number(coord.longitude);
                                                    return !isNaN(lat) && !isNaN(lng) && 
                                                           lat >= -90 && lat <= 90 && 
                                                           lng >= -180 && lng <= 180;
                                                })
                                                .slice(0, 500)
                                                .map(coord => ({
                                                    latitude: Number(coord.latitude),
                                                    longitude: Number(coord.longitude),
                                                }));
                                            
                                            if (reqRouteCoordinates.length < 2) {
                                                reqRouteCoordinates = [safeReqPickup, safeReqDropoff];
                                            }
                                        } else {
                                            reqRouteCoordinates = [safeReqPickup, safeReqDropoff];
                                        }
                                        
                                        markers.push(
                                            <Marker
                                                key={`pending-${ride.id}-${request.id}-pickup`}
                                                coordinate={safeReqPickup}
                                                pinColor="#FFA500"
                                                title={`${request.passenger_name || 'Passenger'} - Pickup (Pending)`}
                                                onPress={() => handleRidePress(ride)}
                                            />,
                                            <Marker
                                                key={`pending-${ride.id}-${request.id}-dropoff`}
                                                coordinate={safeReqDropoff}
                                                pinColor="#FF8C00"
                                                title={`${request.passenger_name || 'Passenger'} - Dropoff (Pending)`}
                                                onPress={() => handleRidePress(ride)}
                                            />,
                                            <Polyline
                                                key={`pending-${ride.id}-${request.id}-route`}
                                                coordinates={reqRouteCoordinates}
                                                strokeColor="#FFA500"
                                                strokeWidth={2}
                                                lineDashPattern={reqRouteData ? undefined : [3, 3]}
                                                tappable={true}
                                                onPress={() => handleRidePress(ride)}
                                            />
                                        );
                                    }
                                }
                            });
                        }
                    });
                    
                    return markers;
                })()}
            </MapView>

            {/* Map Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
                    <Text style={styles.controlButtonText}>📍</Text>
                </TouchableOpacity>
            </View>

            {/* Info Card */}
            <Card style={styles.infoCard}>
                <Text style={styles.infoTitle}>Your Rides</Text>
                {loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={[styles.infoText, { marginLeft: 8 }]}>Loading rides...</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.infoText}>
                            {rides.length} {rides.length === 1 ? 'ride' : 'rides'} total
                        </Text>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.primary }]} />
                                <Text style={styles.legendText}>Offered ({rides.filter(r => r.rideType === 'offered').length})</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: Colors.secondary }]} />
                                <Text style={styles.legendText}>Requested ({rides.filter(r => r.rideType === 'requested').length})</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Card>

            {/* Selected Ride Details Card */}
            {selectedRide && (
                <Card style={styles.rideDetailsCard}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSelectedRide(null)}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.rideDetailsTitle}>
                        {selectedRide.rideType === 'offered' ? 'Your Offered Ride' : 'Your Requested Ride'}
                    </Text>
                    <Text style={styles.rideDetailsRoute}>
                        {selectedRide.pickup_address} → {selectedRide.dropoff_address}
                    </Text>
                    <View style={styles.rideDetailsInfo}>
                        <Text style={styles.rideDetailsText}>
                            ⏰ {selectedRide.schedule_time || 'N/A'}
                        </Text>
                        <Text style={styles.rideDetailsText}>
                            💰 ${selectedRide.price != null && !isNaN(parseFloat(selectedRide.price)) 
                                ? parseFloat(selectedRide.price).toFixed(2) 
                                : '0.00'}
                        </Text>
                        {selectedRide.available_seats && (
                            <Text style={styles.rideDetailsText}>
                                🪑 {selectedRide.available_seats} seat{selectedRide.available_seats > 1 ? 's' : ''}
                            </Text>
                        )}
                    </View>
                    {selectedRide.driver_rating > 0 && (
                        <Text style={styles.rideDetailsRating}>
                            ⭐ {selectedRide.driver_rating}
                        </Text>
                    )}
                </Card>
            )}
        </View>
    );
};

export default MapScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.textSecondary,
    },
    unavailableContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
        padding: 32,
    },
    unavailableText: {
        fontSize: 18,
        color: Colors.textSecondary,
        textAlign: "center",
        fontWeight: "500",
    },
    controls: {
        position: "absolute",
        bottom: 100,
        right: 16,
    },
    controlButton: {
        backgroundColor: Colors.backgroundLight,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 8,
    },
    controlButtonText: {
        fontSize: 24,
    },
    infoCard: {
        position: "absolute",
        top: 100,
        left: 16,
        right: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    legend: {
        marginTop: 8,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    rideDetailsCard: {
        position: "absolute",
        bottom: 100,
        left: 16,
        right: 16,
        maxHeight: 200,
    },
    closeButton: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: "bold",
    },
    rideDetailsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 4,
        paddingRight: 32,
    },
    rideDetailsRoute: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    rideDetailsInfo: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 4,
    },
    rideDetailsText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    rideDetailsRating: {
        fontSize: 12,
        color: Colors.secondary,
        fontWeight: "600",
        marginTop: 4,
    },
});

