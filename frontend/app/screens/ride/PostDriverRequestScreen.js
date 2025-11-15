import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TimePicker from "../../../components/common/TimePicker";
import { driverRequestsAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { getLocationSelectionResult } from "../map/LocationSelectionScreen";

/**
 * Post Driver Request Screen
 * Allows drivers to post a "Looking for Riders" request
 */

const PostDriverRequestScreen = () => {
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
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    
    const pickupLocationRef = useRef(pickupLocation);
    const dropoffLocationRef = useRef(dropoffLocation);
    const pickupCoordinatesRef = useRef(pickupCoordinates);
    const dropoffCoordinatesRef = useRef(dropoffCoordinates);
    
    useEffect(() => {
        pickupLocationRef.current = pickupLocation;
        dropoffLocationRef.current = dropoffLocation;
        pickupCoordinatesRef.current = pickupCoordinates;
        dropoffCoordinatesRef.current = dropoffCoordinates;
    }, [pickupLocation, dropoffLocation, pickupCoordinates, dropoffCoordinates]);

    useEffect(() => {
        if (route.params?.pickupLocation) {
            setPickupLocation(route.params.pickupLocation);
            setPickupCoordinates(route.params.pickupCoordinates);
        }
        if (route.params?.dropoffLocation) {
            setDropoffLocation(route.params.dropoffLocation);
            setDropoffCoordinates(route.params.dropoffCoordinates);
        }
        if (route.params?.time) {
            setTime(route.params.time);
        }
        if (route.params?.days && Array.isArray(route.params.days)) {
            setDays(route.params.days);
        }
    }, [route.params]);

    useFocusEffect(
        React.useCallback(() => {
            const result = getLocationSelectionResult();
            if (result) {
                if (result.type === 'pickup') {
                    setPickupLocation(result.address);
                    setPickupCoordinates(result.coordinates);
                } else if (result.type === 'dropoff') {
                    setDropoffLocation(result.address);
                    setDropoffCoordinates(result.coordinates);
                }
            }
        }, [])
    );

    const handleSelectLocation = (type) => {
        navigation.navigate("LocationSelection", {
            type,
            currentLocation: type === 'pickup' ? pickupLocationRef.current : dropoffLocationRef.current,
            currentCoordinates: type === 'pickup' ? pickupCoordinatesRef.current : dropoffCoordinatesRef.current,
        });
    };

    const dayOptions = [
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
            setDays(days.filter(d => d !== dayValue));
        } else {
            setDays([...days, dayValue]);
        }
    };

    const handlePostRequest = async () => {
        if (!pickupLocation || !dropoffLocation || !time || days.length === 0 || !price) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (!pickupCoordinates || !dropoffCoordinates) {
            Alert.alert("Error", "Please select valid pickup and dropoff locations");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in to post a request");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
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
                notes: notes.trim() || null,
            };

            const response = await driverRequestsAPI.createDriverRequest(requestData);

            if (response.data.success) {
                Alert.alert(
                    "Success",
                    "Your 'Looking for Riders' request has been posted! Passengers can now find and respond to it.",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate("MyRides"),
                        },
                    ]
                );
            } else {
                Alert.alert("Error", response.data.message || "Failed to post request");
            }
        } catch (error) {
            console.error("Post driver request error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to post request";
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
            <Header title="Looking for Riders" showBack={true} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.description}>
                        Post a request to let passengers know you're looking for riders on this route. 
                        Passengers can respond to your request and you can accept or reject them.
                    </Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Pickup Location *</Text>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={() => handleSelectLocation("pickup")}
                    >
                        <Text style={[styles.locationText, !pickupLocation && styles.placeholder]}>
                            {pickupLocation || "Select pickup location"}
                        </Text>
                    </TouchableOpacity>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Dropoff Location *</Text>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={() => handleSelectLocation("dropoff")}
                    >
                        <Text style={[styles.locationText, !dropoffLocation && styles.placeholder]}>
                            {dropoffLocation || "Select dropoff location"}
                        </Text>
                    </TouchableOpacity>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Schedule Time *</Text>
                    <TimePicker value={time} onChange={setTime} />
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.label}>Days *</Text>
                    <View style={styles.daysContainer}>
                        {dayOptions.map((day) => (
                            <TouchableOpacity
                                key={day.value}
                                style={[
                                    styles.dayButton,
                                    days.includes(day.value) && styles.dayButtonActive,
                                ]}
                                onPress={() => toggleDay(day.value)}
                            >
                                <Text
                                    style={[
                                        styles.dayButtonText,
                                        days.includes(day.value) && styles.dayButtonTextActive,
                                    ]}
                                >
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Input
                        label="Price per Seat ($) *"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                    />
                </Card>

                <Card style={styles.card}>
                    <Input
                        label="Available Seats *"
                        value={availableSeats}
                        onChangeText={setAvailableSeats}
                        keyboardType="number-pad"
                        placeholder="1"
                    />
                </Card>

                <Card style={styles.card}>
                    <Input
                        label="Notes (Optional)"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any additional information..."
                        multiline
                        numberOfLines={3}
                    />
                </Card>

                <Button
                    title={loading ? "Posting..." : "Post Request"}
                    onPress={handlePostRequest}
                    disabled={loading}
                    style={styles.submitButton}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default PostDriverRequestScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    locationButton: {
        padding: 12,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    locationText: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    placeholder: {
        color: Colors.textSecondary,
    },
    daysContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    dayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    dayButtonText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    dayButtonTextActive: {
        color: Colors.white,
        fontWeight: "600",
    },
    submitButton: {
        marginTop: 8,
        marginBottom: 32,
    },
});

