import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Dimensions, Image } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TimePicker from "../../../components/common/TimePicker";
import { ridesAPI, routesAPI, driverRequestsAPI, riderSearchesAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { getLocationSelectionResult } from "../map/LocationSelectionScreen";
import { decodePolyline } from "../../../utils/polyline";
import { MAP_CONFIG } from "../../../constants/config";
import { getProfilePictureUrl } from "../../../utils/profilePicture";

/**
 * Search Ride Screen
 * Allows passengers to search for matching rides
 */

const SearchRideScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { currentRole, user } = useAuth();
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");
    const [pickupCoordinates, setPickupCoordinates] = useState(null);
    const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
    const [time, setTime] = useState("");
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [driverRequests, setDriverRequests] = useState([]); // Driver requests (drivers looking for riders)
    const [showMap, setShowMap] = useState(false); // Show map after search
    const [passengerRoute, setPassengerRoute] = useState(null); // Passenger route polyline
    const [selectedDriver, setSelectedDriver] = useState(null); // Selected driver recommendation
    const [driverOriginalRoute, setDriverOriginalRoute] = useState(null); // Driver's original route
    const [mapRegion, setMapRegion] = useState(null);
    const mapRef = useRef(null);
    const scrollViewRef = useRef(null);
    const [editingSearchId, setEditingSearchId] = useState(null); // Track if editing a saved search
    
    // Use refs to track current values for use in callbacks
    const pickupLocationRef = useRef(pickupLocation);
    const dropoffLocationRef = useRef(dropoffLocation);
    const pickupCoordinatesRef = useRef(pickupCoordinates);
    const dropoffCoordinatesRef = useRef(dropoffCoordinates);
    
    // Update refs when state changes
    useEffect(() => {
        pickupLocationRef.current = pickupLocation;
        dropoffLocationRef.current = dropoffLocation;
        pickupCoordinatesRef.current = pickupCoordinates;
        dropoffCoordinatesRef.current = dropoffCoordinates;
    }, [pickupLocation, dropoffLocation, pickupCoordinates, dropoffCoordinates]);

    // Initialize state from route params on mount
    useEffect(() => {
        if (route.params?.pickupLocation) {
            setPickupLocation(route.params.pickupLocation);
        }
        if (route.params?.dropoffLocation) {
            setDropoffLocation(route.params.dropoffLocation);
        }
        if (route.params?.pickupCoordinates) {
            setPickupCoordinates(route.params.pickupCoordinates);
        }
        if (route.params?.dropoffCoordinates) {
            setDropoffCoordinates(route.params.dropoffCoordinates);
        }
        if (route.params?.time) {
            setTime(route.params.time);
        }
        if (route.params?.days && Array.isArray(route.params.days)) {
            setDays(route.params.days);
        }
        if (route.params?.editingSearchId) {
            setEditingSearchId(route.params.editingSearchId);
        }
    }, [route.params]);

    // Also listen for params changes (not just on focus)
    useEffect(() => {
        // Check for location selection result from temporary storage
        const locationResult = getLocationSelectionResult();
        const selectedLocation = locationResult?.selectedLocation || route.params?.selectedLocation;
        
        if (selectedLocation && selectedLocation.locationType) {
            if (selectedLocation.locationType === 'pickup') {
                const address = selectedLocation.address || "";
                const coords = {
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                };
                setPickupLocation(address);
                setPickupCoordinates(coords);
                
                // Restore preserved dropoff from route params if it exists
                if (route.params?.dropoffLocation) {
                    setDropoffLocation(route.params.dropoffLocation);
                }
                if (route.params?.dropoffCoordinates) {
                    setDropoffCoordinates(route.params.dropoffCoordinates);
                }
                
                // Store in route params to persist
                navigation.setParams({
                    pickupLocation: address,
                    pickupCoordinates: coords,
                    dropoffLocation: route.params?.dropoffLocation || dropoffLocationRef.current || "",
                    dropoffCoordinates: route.params?.dropoffCoordinates || dropoffCoordinatesRef.current || null,
                    selectedLocation: undefined, // Clear the temp param
                });
            } else if (selectedLocation.locationType === 'dropoff') {
                const address = selectedLocation.address || "";
                const coords = {
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                };
                setDropoffLocation(address);
                setDropoffCoordinates(coords);
                
                // Restore preserved pickup from route params if it exists
                if (route.params?.pickupLocation) {
                    setPickupLocation(route.params.pickupLocation);
                }
                if (route.params?.pickupCoordinates) {
                    setPickupCoordinates(route.params.pickupCoordinates);
                }
                
                // Store in route params to persist
                navigation.setParams({
                    dropoffLocation: address,
                    dropoffCoordinates: coords,
                    pickupLocation: route.params?.pickupLocation || pickupLocationRef.current || "",
                    pickupCoordinates: route.params?.pickupCoordinates || pickupCoordinatesRef.current || null,
                    selectedLocation: undefined, // Clear the temp param
                });
            }
        }
    }, [route.params?.selectedLocation, route.params?.pickupLocation, route.params?.dropoffLocation, route.params?.pickupCoordinates, route.params?.dropoffCoordinates, navigation]);

    // Handle location selection from LocationSelectionScreen
    useFocusEffect(
        React.useCallback(() => {
            // Check for location selection result from temporary storage
            const locationResult = getLocationSelectionResult();
            const selectedLocation = locationResult?.selectedLocation || route.params?.selectedLocation;
            
            if (selectedLocation && selectedLocation.locationType) {
                if (selectedLocation.locationType === 'pickup') {
                    const address = selectedLocation.address || "";
                    const coords = {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                    };
                    setPickupLocation(address);
                    setPickupCoordinates(coords);
                    
                    // Restore preserved dropoff from locationResult or route params
                    if (locationResult?.dropoffLocation) {
                        setDropoffLocation(locationResult.dropoffLocation);
                    } else if (route.params?.dropoffLocation) {
                        setDropoffLocation(route.params.dropoffLocation);
                    }
                    if (locationResult?.dropoffCoordinates) {
                        setDropoffCoordinates(locationResult.dropoffCoordinates);
                    } else if (route.params?.dropoffCoordinates) {
                        setDropoffCoordinates(route.params.dropoffCoordinates);
                    }
                    
                    // Store in route params to persist
                    navigation.setParams({
                        pickupLocation: address,
                        pickupCoordinates: coords,
                        dropoffLocation: locationResult?.dropoffLocation || route.params?.dropoffLocation || dropoffLocationRef.current || "",
                        dropoffCoordinates: locationResult?.dropoffCoordinates || route.params?.dropoffCoordinates || dropoffCoordinatesRef.current || null,
                        selectedLocation: undefined, // Clear the temp param
                    });
                } else if (selectedLocation.locationType === 'dropoff') {
                    const address = selectedLocation.address || "";
                    const coords = {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                    };
                    setDropoffLocation(address);
                    setDropoffCoordinates(coords);
                    
                    // Restore preserved pickup from locationResult or route params
                    if (locationResult?.pickupLocation) {
                        setPickupLocation(locationResult.pickupLocation);
                    } else if (route.params?.pickupLocation) {
                        setPickupLocation(route.params.pickupLocation);
                    }
                    if (locationResult?.pickupCoordinates) {
                        setPickupCoordinates(locationResult.pickupCoordinates);
                    } else if (route.params?.pickupCoordinates) {
                        setPickupCoordinates(route.params.pickupCoordinates);
                    }
                    
                    // Store in route params to persist
                    navigation.setParams({
                        dropoffLocation: address,
                        dropoffCoordinates: coords,
                        pickupLocation: route.params?.pickupLocation || pickupLocationRef.current || "",
                        pickupCoordinates: route.params?.pickupCoordinates || pickupCoordinatesRef.current || null,
                        selectedLocation: undefined, // Clear the temp param
                    });
                }
            }
        }, [route.params?.selectedLocation, route.params?.pickupLocation, route.params?.dropoffLocation, route.params?.pickupCoordinates, route.params?.dropoffCoordinates, navigation])
    );

    const weekDays = [
        { label: "Mon", value: "monday" },
        { label: "Tue", value: "tuesday" },
        { label: "Wed", value: "wednesday" },
        { label: "Thu", value: "thursday" },
        { label: "Fri", value: "friday" },
        { label: "Sat", value: "saturday" },
        { label: "Sun", value: "sunday" },
    ];

    const toggleDay = (dayValue) => {
        if (days.includes(dayValue)) {
            setDays(days.filter((d) => d !== dayValue));
        } else {
            setDays([...days, dayValue]);
        }
    };

    const handleSearch = async () => {
        if (!pickupLocation || !dropoffLocation || !time || days.length === 0) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (!pickupCoordinates || !dropoffCoordinates) {
            Alert.alert("Error", "Please select valid pickup and dropoff locations");
            return;
        }

        setLoading(true);
        setSelectedDriver(null); // Reset selected driver
        try {
            // Ensure coordinates are numbers, not strings
            const searchParams = {
                pickup_latitude: parseFloat(pickupCoordinates.latitude),
                pickup_longitude: parseFloat(pickupCoordinates.longitude),
                pickup_address: pickupLocation,
                dropoff_latitude: parseFloat(dropoffCoordinates.latitude),
                dropoff_longitude: parseFloat(dropoffCoordinates.longitude),
                dropoff_address: dropoffLocation,
                schedule_days: Array.isArray(days) ? days : [],
                schedule_time: time || '',
            };

            console.log('Sending search request:', searchParams);

            // Calculate passenger route first
            try {
                const routeResponse = await routesAPI.calculateRoute(
                    { latitude: searchParams.pickup_latitude, longitude: searchParams.pickup_longitude },
                    { latitude: searchParams.dropoff_latitude, longitude: searchParams.dropoff_longitude }
                );
                
                if (routeResponse.data.success) {
                    const route = routeResponse.data.data.route;
                    setPassengerRoute(route);
                }
            } catch (routeError) {
                console.error("Error calculating passenger route:", routeError);
                // Continue even if route calculation fails
            }
            
            // Calculate map region to fit both points (always do this)
            const minLat = Math.min(searchParams.pickup_latitude, searchParams.dropoff_latitude);
            const maxLat = Math.max(searchParams.pickup_latitude, searchParams.dropoff_latitude);
            const minLng = Math.min(searchParams.pickup_longitude, searchParams.dropoff_longitude);
            const maxLng = Math.max(searchParams.pickup_longitude, searchParams.dropoff_longitude);
            
            const latDelta = (maxLat - minLat) * 1.5 || 0.05;
            const lngDelta = (maxLng - minLng) * 1.5 || 0.05;
            
            setMapRegion({
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(latDelta, 0.01),
                longitudeDelta: Math.max(lngDelta, 0.01),
            });

            // Search for matching rides AND driver requests
            const [ridesResponse, driverRequestsResponse] = await Promise.all([
                ridesAPI.searchRides(searchParams).catch(err => {
                    console.error("Error searching rides:", err);
                    return { data: { success: false, data: { matches: [] } } };
                }),
                driverRequestsAPI.searchDriverRequests(searchParams).catch(err => {
                    console.error("Error searching driver requests:", err);
                    return { data: { success: false, data: { matches: [] } } };
                })
            ]);

            const matches = ridesResponse.data.success ? (ridesResponse.data.data.matches || []) : [];
            const driverRequestMatches = driverRequestsResponse.data.success ? (driverRequestsResponse.data.data.matches || []) : [];
            
            console.log('Search results:', matches.length, 'Driver requests:', driverRequestMatches.length);
            
            setResults(matches);
            setDriverRequests(driverRequestMatches);
            setShowMap(true); // Show map with results
            
            // Auto-scroll to results after a short delay to ensure UI is rendered
            setTimeout(() => {
                if (scrollViewRef.current) {
                    // Scroll to show the results section
                    // First scroll to a position that shows the map and results
                    scrollViewRef.current.scrollTo({
                        y: 600, // Scroll past the form to show map and results
                        animated: true,
                    });
                }
            }, 600);
            
            // Don't show alert - let the UI handle it
        } catch (error) {
            console.error("Search rides error:", error);
            // Get detailed error message (as per Stack Overflow solution)
            let errorMessage = "Failed to search rides";
            if (error.response) {
                // Server responded with error
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                errorMessage = error.response.data?.message || 
                              error.response.data?.error || 
                              error.response.data?.errors?.[0]?.msg ||
                              `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request made but no response
                console.error("No response received:", error.request);
                errorMessage = "No response from server. Check your connection.";
            } else {
                // Error setting up request
                console.error("Error setting up request:", error.message);
                errorMessage = error.message;
            }
            Alert.alert("Error", errorMessage);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch driver's original route when driver is selected
    useEffect(() => {
        if (selectedDriver && selectedDriver.pickupLocation && selectedDriver.dropoffLocation) {
            // Fetch driver's original route (the route they usually take)
            const fetchDriverOriginalRoute = async () => {
                try {
                    const routeResponse = await routesAPI.calculateRoute(
                        selectedDriver.pickupLocation,
                        selectedDriver.dropoffLocation
                    );
                    
                    if (routeResponse.data.success) {
                        setDriverOriginalRoute(routeResponse.data.data.route);
                    }
                } catch (error) {
                    console.error("Error fetching driver's original route:", error);
                    // If backend already provided originalRoute with polyline, use that
                    if (selectedDriver.originalRoute && selectedDriver.originalRoute.polyline) {
                        setDriverOriginalRoute(selectedDriver.originalRoute);
                    }
                }
            };
            
            // Check if originalRoute is already in the match data
            if (selectedDriver.originalRoute && selectedDriver.originalRoute.polyline) {
                setDriverOriginalRoute(selectedDriver.originalRoute);
            } else {
                fetchDriverOriginalRoute();
            }
        } else {
            setDriverOriginalRoute(null);
        }
    }, [selectedDriver]);

    // Update map region when driver is selected
    useEffect(() => {
        if (selectedDriver && mapRef.current) {
            // Fit map to show passenger route, driver original route, and recommended route
            const allPoints = [];
            
            // Add passenger route points
            if (passengerRoute && passengerRoute.polyline) {
                const passengerPoints = decodePolyline(passengerRoute.polyline);
                allPoints.push(...passengerPoints);
            }
            
            // Add driver's original route points
            if (driverOriginalRoute && driverOriginalRoute.polyline) {
                const originalPoints = decodePolyline(driverOriginalRoute.polyline);
                allPoints.push(...originalPoints);
            }
            
            // Add driver recommended route points
            if (selectedDriver.recommendedRoute && selectedDriver.recommendedRoute.polyline) {
                const driverPoints = decodePolyline(selectedDriver.recommendedRoute.polyline);
                allPoints.push(...driverPoints);
            }
            
            if (allPoints.length > 0) {
                const lats = allPoints.map(p => p.latitude);
                const lngs = allPoints.map(p => p.longitude);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                
                const latDelta = (maxLat - minLat) * 1.3 || 0.05;
                const lngDelta = (maxLng - minLng) * 1.3 || 0.05;
                
                const newRegion = {
                    latitude: (minLat + maxLat) / 2,
                    longitude: (minLng + maxLng) / 2,
                    latitudeDelta: Math.max(latDelta, 0.01),
                    longitudeDelta: Math.max(lngDelta, 0.01),
                };
                
                setMapRegion(newRegion);
                setTimeout(() => {
                    mapRef.current?.animateToRegion(newRegion, 1000);
                }, 100);
            }
        }
    }, [selectedDriver, driverOriginalRoute]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Header title="Search Rides" />
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Your Route</Text>

                    <TouchableOpacity
                        onPress={() => {
                            // Use refs to get latest values
                            const currentPickupCoords = pickupCoordinatesRef.current;
                            const currentPickupLoc = pickupLocationRef.current;
                            const currentDropoffCoords = dropoffCoordinatesRef.current;
                            const currentDropoffLoc = dropoffLocationRef.current;
                            
                            navigation.navigate("LocationSelection", {
                                locationType: "pickup",
                                initialLocation: currentPickupCoords ? {
                                    latitude: currentPickupCoords.latitude,
                                    longitude: currentPickupCoords.longitude,
                                    address: currentPickupLoc,
                                } : null,
                                returnScreen: "SearchRide",
                                // Preserve existing locations using refs
                                existingPickupLocation: currentPickupLoc,
                                existingPickupCoordinates: currentPickupCoords,
                                existingDropoffLocation: currentDropoffLoc,
                                existingDropoffCoordinates: currentDropoffCoords,
                            });
                        }}
                    >
                        <Input
                            label="Pickup Location"
                            value={pickupLocation}
                            onChangeText={setPickupLocation}
                            placeholder="Tap to select pickup location"
                            editable={false}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            // Use refs to get latest values
                            const currentPickupCoords = pickupCoordinatesRef.current;
                            const currentPickupLoc = pickupLocationRef.current;
                            const currentDropoffCoords = dropoffCoordinatesRef.current;
                            const currentDropoffLoc = dropoffLocationRef.current;
                            
                            navigation.navigate("LocationSelection", {
                                locationType: "dropoff",
                                initialLocation: currentDropoffCoords ? {
                                    latitude: currentDropoffCoords.latitude,
                                    longitude: currentDropoffCoords.longitude,
                                    address: currentDropoffLoc,
                                } : null,
                                returnScreen: "SearchRide",
                                // Preserve existing locations using refs
                                existingPickupLocation: currentPickupLoc,
                                existingPickupCoordinates: currentPickupCoords,
                                existingDropoffLocation: currentDropoffLoc,
                                existingDropoffCoordinates: currentDropoffCoords,
                            });
                        }}
                    >
                        <Input
                            label="Dropoff Location"
                            value={dropoffLocation}
                            onChangeText={setDropoffLocation}
                            placeholder="Tap to select dropoff location"
                            editable={false}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Schedule</Text>

                    <TimePicker
                        label="Time"
                        value={time}
                        onChange={setTime}
                        placeholder="Select time"
                    />

                    <Text style={styles.label}>Days of Week</Text>
                    <View style={styles.daysContainer}>
                        {weekDays.map((day) => (
                            <Button
                                key={day.value}
                                title={day.label}
                                variant={days.includes(day.value) ? "primary" : "outline"}
                                onPress={() => toggleDay(day.value)}
                                style={styles.dayButton}
                            />
                        ))}
                    </View>
                </Card>

                <Button
                    title="Search Rides"
                    onPress={handleSearch}
                    loading={loading}
                    style={styles.searchButton}
                />

                {/* Map View - Show after search */}
                {showMap && pickupCoordinates && dropoffCoordinates && mapRegion && (
                    <Card style={styles.mapCard}>
                        <Text style={styles.sectionTitle}>Your Route & Recommendations</Text>
                        
                        {/* Route Legend */}
                        {selectedDriver && (
                            <View style={styles.legendContainer}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendLine, { backgroundColor: Colors.primary }]} />
                                    <Text style={styles.legendText}>Your Route</Text>
                                </View>
                                {driverOriginalRoute && (
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendLine, { backgroundColor: '#888888' }]} />
                                        <Text style={styles.legendText}>Driver's Usual Route</Text>
                                    </View>
                                )}
                                {selectedDriver.recommendedRoute && (
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendLine, { backgroundColor: Colors.secondary }]} />
                                        <Text style={styles.legendText}>Recommended Route</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        
                        <View style={styles.mapContainer}>
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                region={mapRegion}
                                onRegionChangeComplete={setMapRegion}
                                showsUserLocation={false}
                                showsMyLocationButton={false}
                            >
                                {/* Passenger Pickup Marker */}
                                <Marker
                                    coordinate={pickupCoordinates}
                                    title="Your Pickup"
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={styles.smallMarker}>
                                        <View style={[styles.markerDot, { backgroundColor: Colors.primary }]} />
                                    </View>
                                </Marker>
                                
                                {/* Passenger Dropoff Marker */}
                                <Marker
                                    coordinate={dropoffCoordinates}
                                    title="Your Dropoff"
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={styles.smallMarker}>
                                        <View style={[styles.markerDot, { backgroundColor: Colors.error }]} />
                                    </View>
                                </Marker>
                                
                                {/* Passenger Route (Your Route) */}
                                {passengerRoute && passengerRoute.polyline && (
                                    <Polyline
                                        coordinates={decodePolyline(passengerRoute.polyline)}
                                        strokeColor={Colors.primary}
                                        strokeWidth={4}
                                    />
                                )}
                                
                                {/* Driver's Original Route (the route they usually take) */}
                                {selectedDriver && driverOriginalRoute && driverOriginalRoute.polyline && (
                                    <>
                                        {/* Driver Origin Marker */}
                                        <Marker
                                            coordinate={selectedDriver.pickupLocation}
                                            title={`${selectedDriver.driver_name}'s Start`}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                            <View style={styles.smallMarker}>
                                                <View style={[styles.markerDot, { backgroundColor: Colors.secondary }]} />
                                            </View>
                                        </Marker>
                                        
                                        {/* Driver Destination Marker */}
                                        <Marker
                                            coordinate={selectedDriver.dropoffLocation}
                                            title={`${selectedDriver.driver_name}'s End`}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                            <View style={styles.smallMarker}>
                                                <View style={[styles.markerDot, { backgroundColor: Colors.secondary }]} />
                                            </View>
                                        </Marker>
                                        
                                        {/* Driver's Original Route (usual route) */}
                                        <Polyline
                                            coordinates={decodePolyline(driverOriginalRoute.polyline)}
                                            strokeColor="#888888" // Gray for original route
                                            strokeWidth={4}
                                        />
                                    </>
                                )}
                                
                                {/* Driver's Recommended Route (with passenger pickup/dropoff) */}
                                {selectedDriver && selectedDriver.recommendedRoute && selectedDriver.recommendedRoute.polyline && (
                                    <>
                                        {/* Driver Recommended Route (with waypoints) */}
                                        <Polyline
                                            coordinates={decodePolyline(selectedDriver.recommendedRoute.polyline)}
                                            strokeColor={Colors.secondary} // Green for recommended route
                                            strokeWidth={5}
                                        />
                                        
                                        {/* Highlight passenger pickup point on driver route */}
                                        {selectedDriver.recommendedRoute.legs && selectedDriver.recommendedRoute.legs.length > 0 && (
                                            <>
                                                {/* Passenger pickup point (first leg end) */}
                                                {selectedDriver.recommendedRoute.legs[0]?.endLocation && (
                                                    <Marker
                                                        coordinate={selectedDriver.recommendedRoute.legs[0].endLocation}
                                                        title="Pickup Point"
                                                        anchor={{ x: 0.5, y: 0.5 }}
                                                    >
                                                        <View style={styles.smallMarker}>
                                                            <View style={[styles.markerDot, { backgroundColor: "#FFA500" }]} />
                                                        </View>
                                                    </Marker>
                                                )}
                                                
                                                {/* Passenger dropoff point (second leg end) */}
                                                {selectedDriver.recommendedRoute.legs[1]?.endLocation && (
                                                    <Marker
                                                        coordinate={selectedDriver.recommendedRoute.legs[1].endLocation}
                                                        title="Dropoff Point"
                                                        anchor={{ x: 0.5, y: 0.5 }}
                                                    >
                                                        <View style={styles.smallMarker}>
                                                            <View style={[styles.markerDot, { backgroundColor: "#FFA500" }]} />
                                                        </View>
                                                    </Marker>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </MapView>
                        </View>
                    </Card>
                )}

                {/* Driver Requests - Drivers Looking for Riders */}
                {showMap && driverRequests.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>Drivers Looking for Riders ({driverRequests.length})</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.resultsScroll}
                            contentContainerStyle={styles.resultsScrollContent}
                        >
                            {driverRequests.map((request) => (
                                <Card 
                                    key={`driver-request-${request.id}`} 
                                    style={styles.resultCard}
                                >
                                    <View style={styles.resultHeader}>
                                        <View style={styles.driverInfo}>
                                            {request.driver_avatar_url ? (
                                                <Image 
                                                    source={{ uri: request.driver_avatar_url }} 
                                                    style={styles.driverAvatar}
                                                />
                                            ) : request.driver_id ? (
                                                <Image 
                                                    source={{ uri: getProfilePictureUrl(request.driver_id) }} 
                                                    style={styles.driverAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.driverAvatar, styles.driverAvatarPlaceholder]}>
                                                    <Text style={styles.driverAvatarText}>
                                                        {(request.driver_name || "D").charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.driverNameContainer}>
                                                <Text style={styles.driverName}>{request.driver_name || "Driver"}</Text>
                                                <Text style={styles.rating}>⭐ {request.driver_rating || "0.0"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {request.matchScore && (
                                        <View style={styles.matchScoreContainer}>
                                            <Text style={styles.matchScoreLabel}>Match Score:</Text>
                                            <Text style={styles.matchScore}>{request.matchScore}/100</Text>
                                        </View>
                                    )}
                                    
                                    <Text style={styles.routeText}>
                                        📍 {request.pickup_address || 'N/A'}
                                    </Text>
                                    <Text style={styles.routeText}>
                                        🎯 {request.dropoff_address || 'N/A'}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        ⏰ {request.schedule_time || 'N/A'} • {Array.isArray(request.schedule_days) ? request.schedule_days.join(', ') : request.schedule_days}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        💰 ${parseFloat(request.price || 0).toFixed(2)} • 🪑 {request.available_seats || 1} seat{request.available_seats > 1 ? 's' : ''}
                                    </Text>
                                    
                                    <Button
                                        title="Respond to Request"
                                        onPress={async () => {
                                            try {
                                                const response = await driverRequestsAPI.respondToDriverRequest(request.id, {
                                                    pickup_latitude: pickupCoordinates?.latitude,
                                                    pickup_longitude: pickupCoordinates?.longitude,
                                                    pickup_address: pickupLocation,
                                                    dropoff_latitude: dropoffCoordinates?.latitude,
                                                    dropoff_longitude: dropoffCoordinates?.longitude,
                                                    dropoff_address: dropoffLocation,
                                                });
                                                if (response.data.success) {
                                                    Alert.alert("Success", "Response sent! The driver will be notified.");
                                                } else {
                                                    Alert.alert("Error", response.data.message || "Failed to respond");
                                                }
                                            } catch (error) {
                                                console.error("Respond to driver request error:", error);
                                                const errorMessage = error.response?.data?.message || error.message || "Failed to respond";
                                                Alert.alert("Error", errorMessage);
                                            }
                                        }}
                                        style={styles.requestButton}
                                    />
                                </Card>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Results - Show below map */}
                {showMap && results.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>Found {results.length} matching ride(s)</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.resultsScroll}
                            contentContainerStyle={styles.resultsScrollContent}
                        >
                            {results.map((ride) => (
                                <Card 
                                    key={ride.id} 
                                    style={[
                                        styles.resultCard,
                                        selectedDriver?.id === ride.id && styles.resultCardSelected
                                    ]}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedDriver(selectedDriver?.id === ride.id ? null : ride);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.resultHeader}>
                                            <View style={styles.driverInfo}>
                                                {ride.driver_avatar_url ? (
                                                    <Image 
                                                        source={{ uri: ride.driver_avatar_url }} 
                                                        style={styles.driverAvatar}
                                                    />
                                                ) : ride.driver_id ? (
                                                    <Image 
                                                        source={{ uri: getProfilePictureUrl(ride.driver_id) }} 
                                                        style={styles.driverAvatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.driverAvatar, styles.driverAvatarPlaceholder]}>
                                                        <Text style={styles.driverAvatarText}>
                                                            {(ride.driver_name || "D").charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={styles.driverNameContainer}>
                                                    <Text style={styles.driverName}>{ride.driver_name || "Driver"}</Text>
                                                    <Text style={styles.rating}>⭐ {ride.driver_rating || "0.0"}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        {/* Match Score */}
                                        {ride.matchScore && (
                                            <View style={styles.matchScoreContainer}>
                                                <Text style={styles.matchScoreLabel}>Match Score:</Text>
                                                <Text style={styles.matchScore}>{ride.matchScore}/100</Text>
                                            </View>
                                        )}
                                        
                                        {/* Match Reasons */}
                                        {ride.reasons && ride.reasons.length > 0 && (
                                            <View style={styles.reasonsContainer}>
                                                {ride.reasons.slice(0, 2).map((reason, idx) => (
                                                    <Text key={idx} style={styles.reasonText}>✓ {reason}</Text>
                                                ))}
                                            </View>
                                        )}
                                        
                                        <Text style={styles.route}>
                                            {ride.pickup_address} → {ride.dropoff_address}
                                        </Text>
                                        
                                        <View style={styles.resultFooter}>
                                            <View style={styles.timeContainer}>
                                                <Text style={styles.timeLabel}>Time:</Text>
                                                <Text style={styles.time}>{ride.driverTime || ride.schedule_time || 'N/A'}</Text>
                                                {ride.timeDifference !== undefined && ride.timeDifference > 0 && (
                                                    <Text style={[
                                                        styles.timeDifference,
                                                        ride.timeDifference <= 30 ? styles.timeDifferenceGood : styles.timeDifferenceBad
                                                    ]}>
                                                        ({ride.timeDifference} min {ride.timeDifference <= 30 ? 'diff' : 'off'})
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.price}>${parseFloat(ride.price || 0).toFixed(2)}</Text>
                                        </View>
                                        
                                        {/* Detour Info */}
                                        {ride.detourDistance && (
                                            <Text style={styles.detourText}>
                                                Detour: +{ride.detourDistance.toFixed(1)}km
                                            </Text>
                                        )}
                                        
                                        <Text style={styles.seats}>Available seats: {ride.available_seats || 1}</Text>
                                        
                                        {selectedDriver?.id === ride.id && (
                                            <View style={styles.selectedIndicator}>
                                                <Text style={styles.selectedText}>✓ Route shown on map</Text>
                                            </View>
                                        )}
                                        
                                        <Button
                                            title="Request Ride"
                                            onPress={async () => {
                                                if (!pickupCoordinates || !dropoffCoordinates) {
                                                    Alert.alert("Error", "Please select pickup and dropoff locations first");
                                                    return;
                                                }
                                                try {
                                                    const passengerLocations = {
                                                        pickup_latitude: pickupCoordinates.latitude,
                                                        pickup_longitude: pickupCoordinates.longitude,
                                                        pickup_address: pickupLocation,
                                                        dropoff_latitude: dropoffCoordinates.latitude,
                                                        dropoff_longitude: dropoffCoordinates.longitude,
                                                        dropoff_address: dropoffLocation,
                                                    };
                                                    const response = await ridesAPI.requestRide(ride.id, passengerLocations);
                                                    if (response.data.success) {
                                                        Alert.alert("Success", "Ride request sent! The driver will be notified.");
                                                    } else {
                                                        Alert.alert("Error", response.data.message || "Failed to request ride");
                                                    }
                                                } catch (error) {
                                                    console.error("Request ride error:", error);
                                                    let errorMessage = "Failed to request ride";
                                                    if (error.response?.data) {
                                                        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                                                            errorMessage = error.response.data.errors.map(e => e.msg || e.message).join('\n');
                                                        } else {
                                                            errorMessage = error.response.data.message || errorMessage;
                                                        }
                                                    } else {
                                                        errorMessage = error.message || errorMessage;
                                                    }
                                                    Alert.alert("Error", errorMessage);
                                                }
                                            }}
                                            style={styles.requestButton}
                                        />
                                    </TouchableOpacity>
                                </Card>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Save/Update Search Button - Always visible after search */}
                {showMap && pickupLocation && dropoffLocation && time && days.length > 0 && (
                    <Card style={styles.saveSearchCard}>
                        <Button
                            title={editingSearchId ? "💾 Update Saved Search" : "💾 Save Search for Future Matches"}
                            onPress={async () => {
                                if (!pickupCoordinates || !dropoffCoordinates) {
                                    Alert.alert("Error", "Please select valid pickup and dropoff locations first");
                                    return;
                                }
                                try {
                                    const searchData = {
                                        pickup_latitude: pickupCoordinates.latitude,
                                        pickup_longitude: pickupCoordinates.longitude,
                                        pickup_address: pickupLocation,
                                        dropoff_latitude: dropoffCoordinates.latitude,
                                        dropoff_longitude: dropoffCoordinates.longitude,
                                        dropoff_address: dropoffLocation,
                                        schedule_days: days,
                                        schedule_time: time,
                                    };
                                    
                                    let response;
                                    if (editingSearchId) {
                                        // Update existing search
                                        response = await riderSearchesAPI.updateSavedSearch(editingSearchId, searchData);
                                    } else {
                                        // Create new search
                                        response = await riderSearchesAPI.saveSearch(searchData);
                                    }
                                    
                                    if (response.data.success) {
                                        Alert.alert(
                                            "Success", 
                                            editingSearchId 
                                                ? "Search updated! We'll notify you when a matching ride becomes available."
                                                : "Search saved! We'll notify you when a matching ride becomes available.",
                                            [
                                                {
                                                    text: "OK",
                                                    onPress: () => {
                                                        if (editingSearchId) {
                                                            // Navigate back to saved searches after updating
                                                            navigation.navigate("SavedSearches");
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                        // Clear editing state if updating
                                        if (editingSearchId) {
                                            setEditingSearchId(null);
                                        }
                                    } else {
                                        Alert.alert("Error", response.data.message || "Failed to save search");
                                    }
                                } catch (error) {
                                    console.error("Save/Update search error:", error);
                                    let errorMessage = editingSearchId ? "Failed to update search" : "Failed to save search";
                                    if (error.response?.data) {
                                        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                                            errorMessage = error.response.data.errors.map(e => e.msg || e.message).join('\n');
                                        } else {
                                            errorMessage = error.response.data.message || errorMessage;
                                        }
                                    } else {
                                        errorMessage = error.message || errorMessage;
                                    }
                                    Alert.alert("Error", errorMessage);
                                }
                            }}
                            style={styles.saveSearchButton}
                            variant="secondary"
                        />
                    </Card>
                )}

                {/* No Results - Show option to post driver request */}
                {showMap && results.length === 0 && driverRequests.length === 0 && (
                    <Card style={styles.noResultsCard}>
                        <Text style={styles.noResultsTitle}>No Matching Rides Found</Text>
                        <Text style={styles.noResultsText}>
                            We couldn't find any matching rides for your route.
                        </Text>
                        {(currentRole === 'driver' || currentRole === 'both') ? (
                            <>
                                <Text style={styles.noResultsText}>
                                    {"\n"}As a driver, you can:
                                </Text>
                                <Button
                                    title="Add an Offer"
                                    onPress={() => {
                                        console.log('Add an Offer pressed');
                                        navigation.navigate("PostRide", {
                                            pickupLocation,
                                            dropoffLocation,
                                            pickupCoordinates,
                                            dropoffCoordinates,
                                            time,
                                            days,
                                        });
                                    }}
                                    style={styles.postOfferButton}
                                />
                                <Button
                                    title="Post Looking for Riders Request"
                                    onPress={() => {
                                        console.log('Post Looking for Riders Request pressed');
                                        navigation.navigate("PostDriverRequest", {
                                            pickupLocation,
                                            dropoffLocation,
                                            pickupCoordinates,
                                            dropoffCoordinates,
                                            time,
                                            days,
                                        });
                                    }}
                                    style={styles.postRequestButton}
                                />
                            </>
                        ) : (
                            <Text style={styles.noResultsText}>
                                {"\n"}Or switch to driver mode to post a ride offer!
                            </Text>
                        )}
                    </Card>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SearchRideScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    daysContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },
    dayButton: {
        width: "30%",
        paddingVertical: 10,
    },
    searchButton: {
        marginTop: 16,
        marginBottom: 24,
    },
    resultsContainer: {
        marginTop: 8,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    resultCard: {
        marginBottom: 16,
        width: Dimensions.get('window').width - 64, // Full width minus padding
        marginRight: 16,
    },
    resultHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    driverInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    driverAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: Colors.border,
    },
    driverAvatarPlaceholder: {
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    driverAvatarText: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textLight,
    },
    driverNameContainer: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    rating: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    route: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    resultFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    timeLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginRight: 4,
    },
    time: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginRight: 4,
    },
    timeDifference: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    timeDifferenceGood: {
        color: Colors.secondary,
    },
    timeDifferenceBad: {
        color: Colors.error,
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.primary,
    },
    requestButton: {
        marginTop: 8,
    },
    mapCard: {
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
    },
    mapContainer: {
        height: 300,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
        width: '100%',
    },
    resultsScroll: {
        marginTop: 8,
    },
    resultsScrollContent: {
        paddingRight: 16,
    },
    resultCardSelected: {
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    matchScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: Colors.secondary + '20',
        borderRadius: 4,
    },
    matchScoreLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginRight: 4,
    },
    matchScore: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.secondary,
    },
    reasonsContainer: {
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    detourText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    selectedIndicator: {
        marginTop: 8,
        marginBottom: 4,
        padding: 6,
        backgroundColor: Colors.primary + '20',
        borderRadius: 4,
    },
    selectedText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    legendLine: {
        width: 30,
        height: 3,
        marginRight: 6,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    smallMarker: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    noResultsCard: {
        margin: 16,
        padding: 20,
        alignItems: "center",
    },
    noResultsTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 12,
        textAlign: "center",
    },
    noResultsText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 16,
    },
    postOfferButton: {
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: Colors.primary,
    },
    postRequestButton: {
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: Colors.secondary,
    },
    saveSearchCard: {
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: Colors.secondary + '15', // Light green background
        borderWidth: 1,
        borderColor: Colors.secondary + '40',
    },
    saveSearchButton: {
        marginTop: 8,
        marginBottom: 8,
    },
});

