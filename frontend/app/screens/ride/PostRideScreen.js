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
import { useAuth } from "../../../context/AuthContext";
import { getLocationSelectionResult } from "../map/LocationSelectionScreen";

/**
 * Post Ride Screen
 * Allows drivers to post a ride offer with route and schedule
 */

const PostRideScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");
    const [pickupCoordinates, setPickupCoordinates] = useState(null);
    const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
    const [time, setTime] = useState("");
    const [days, setDays] = useState([]);
    const [price, setPrice] = useState("");
    const [availableSeats, setAvailableSeats] = useState("1");
    const [loading, setLoading] = useState(false);
    
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

    const handlePostRide = async () => {
        if (!pickupLocation || !dropoffLocation || !time || days.length === 0 || !price) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (!pickupCoordinates || !dropoffCoordinates) {
            Alert.alert("Error", "Please select valid pickup and dropoff locations");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in to post a ride");
            return;
        }

        setLoading(true);
        try {
            const rideData = {
                pickup_latitude: pickupCoordinates.latitude,
                pickup_longitude: pickupCoordinates.longitude,
                pickup_address: pickupLocation,
                dropoff_latitude: dropoffCoordinates.latitude,
                dropoff_longitude: dropoffCoordinates.longitude,
                dropoff_address: dropoffLocation,
                schedule_days: days,
                schedule_time: time,
                price: parseFloat(price),
                available_seats: parseInt(availableSeats) || 1,
            };

            const response = await ridesAPI.createRide(rideData);

            if (response.data.success) {
                Alert.alert("Success", "Ride posted successfully!", [
                    {
                        text: "OK",
                        onPress: () => {
                            // Reset form
                            setPickupLocation("");
                            setDropoffLocation("");
                            setPickupCoordinates(null);
                            setDropoffCoordinates(null);
                            setTime("");
                            setDays([]);
                            setPrice("");
                            setAvailableSeats("1");
                            // Navigate back
                            navigation.goBack();
                        },
                    },
                ]);
            } else {
                Alert.alert("Error", response.data.message || "Failed to post ride");
            }
        } catch (error) {
            console.error("Post ride error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to post ride";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Header title="Post a Ride" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Route Details</Text>

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
                                returnScreen: "PostRide",
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
                                returnScreen: "PostRide",
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

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Ride Details</Text>

                    <Input
                        label="Price per Ride"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="e.g., 10.00"
                        keyboardType="decimal-pad"
                    />

                    <Input
                        label="Available Seats"
                        value={availableSeats}
                        onChangeText={setAvailableSeats}
                        placeholder="Number of seats"
                        keyboardType="numeric"
                    />
                </Card>

                <Button
                    title="Post Ride"
                    onPress={handlePostRide}
                    loading={loading}
                    style={styles.postButton}
                />
                
                <Card style={styles.card}>
                    <Text style={styles.alternativeText}>
                        Can't find riders? Post a "Looking for Riders" request instead!
                    </Text>
                    <Button
                        title="Post Looking for Riders Request"
                        onPress={() => navigation.navigate("PostDriverRequest", {
                            pickupLocation,
                            dropoffLocation,
                            pickupCoordinates,
                            dropoffCoordinates,
                        })}
                        style={[styles.postButton, { backgroundColor: Colors.secondary }]}
                    />
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default PostRideScreen;

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
    },
    dayButton: {
        flex: 1,
        minWidth: "30%",
        paddingVertical: 10,
    },
    postButton: {
        marginTop: 8,
    },
    alternativeText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 12,
    },
});

