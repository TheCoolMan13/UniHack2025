import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TimePicker from "../../../components/common/TimePicker";
import { ridesAPI } from "../../../services/api";
import { getLocationSelectionResult } from "../map/LocationSelectionScreen";

/**
 * Search Ride Screen
 * Allows passengers to search for matching rides
 */

const SearchRideScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");
    const [pickupCoordinates, setPickupCoordinates] = useState(null);
    const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
    const [time, setTime] = useState("");
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    
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
    }, []);

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
        try {
            const searchParams = {
                pickup_latitude: pickupCoordinates.latitude,
                pickup_longitude: pickupCoordinates.longitude,
                pickup_address: pickupLocation,
                dropoff_latitude: dropoffCoordinates.latitude,
                dropoff_longitude: dropoffCoordinates.longitude,
                dropoff_address: dropoffLocation,
                schedule_days: days,
                schedule_time: time,
            };

            const response = await ridesAPI.searchRides(searchParams);

            if (response.data.success) {
                const matches = response.data.data.matches || [];
                setResults(matches);
                if (matches.length === 0) {
                    Alert.alert("No Results", "No matching rides found. Try adjusting your search criteria.");
                }
            } else {
                Alert.alert("Error", response.data.message || "Failed to search rides");
                setResults([]);
            }
        } catch (error) {
            console.error("Search rides error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to search rides";
            Alert.alert("Error", errorMessage);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Header title="Search Rides" />
            <ScrollView
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

                {/* Results */}
                {results.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>Found {results.length} matching ride(s)</Text>
                        {results.map((ride) => (
                            <Card key={ride.id} style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    <Text style={styles.driverName}>{ride.driver_name || "Driver"}</Text>
                                    <Text style={styles.rating}>⭐ {ride.driver_rating || "0.0"}</Text>
                                </View>
                                <Text style={styles.route}>
                                    {ride.pickup_address} → {ride.dropoff_address}
                                </Text>
                                <View style={styles.resultFooter}>
                                    <Text style={styles.time}>{ride.schedule_time}</Text>
                                    <Text style={styles.price}>${parseFloat(ride.price || 0).toFixed(2)}</Text>
                                </View>
                                <Text style={styles.seats}>Available seats: {ride.available_seats || 1}</Text>
                                <Button
                                    title="Request Ride"
                                    onPress={async () => {
                                        try {
                                            const response = await ridesAPI.requestRide(ride.id);
                                            if (response.data.success) {
                                                Alert.alert("Success", "Ride request sent! The driver will be notified.");
                                            } else {
                                                Alert.alert("Error", response.data.message || "Failed to request ride");
                                            }
                                        } catch (error) {
                                            console.error("Request ride error:", error);
                                            const errorMessage = error.response?.data?.message || error.message || "Failed to request ride";
                                            Alert.alert("Error", errorMessage);
                                        }
                                    }}
                                    style={styles.requestButton}
                                />
                            </Card>
                        ))}
                    </View>
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
    },
    resultHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    driverName: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
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
    time: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.primary,
    },
    requestButton: {
        marginTop: 8,
    },
});

