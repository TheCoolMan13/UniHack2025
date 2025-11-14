import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { ridesAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

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

    // Handle location selection from LocationSelectionScreen
    useFocusEffect(
        React.useCallback(() => {
            const selectedLocation = route.params?.selectedLocation;
            if (selectedLocation && selectedLocation.locationType) {
                if (selectedLocation.locationType === 'pickup') {
                    const address = selectedLocation.address || "";
                    const coords = {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                    };
                    setPickupLocation(address);
                    setPickupCoordinates(coords);
                    // Store in route params to persist - preserve existing params
                    navigation.setParams({
                        ...route.params, // Preserve existing params (like dropoffLocation)
                        pickupLocation: address,
                        pickupCoordinates: coords,
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
                    // Store in route params to persist - preserve existing params
                    navigation.setParams({
                        ...route.params, // Preserve existing params (like pickupLocation)
                        dropoffLocation: address,
                        dropoffCoordinates: coords,
                        selectedLocation: undefined, // Clear the temp param
                    });
                }
            }
        }, [route.params, navigation])
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
                            navigation.navigate("LocationSelection", {
                                locationType: "pickup",
                                initialLocation: pickupCoordinates,
                                returnScreen: "PostRide",
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
                            navigation.navigate("LocationSelection", {
                                locationType: "dropoff",
                                initialLocation: dropoffCoordinates,
                                returnScreen: "PostRide",
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

                    <Input
                        label="Time"
                        value={time}
                        onChangeText={setTime}
                        placeholder="e.g., 7:30 AM"
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
});

