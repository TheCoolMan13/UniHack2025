import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import { geocodeAddress, reverseGeocode, searchAddressSuggestions } from "../../../services/geocoding";
import Button from "../../../components/common/Button";

// Temporary storage for location selection results
// This allows us to pass data back when going back from a modal
let locationSelectionResult = null;
export const getLocationSelectionResult = () => {
    const result = locationSelectionResult;
    locationSelectionResult = null; // Clear after reading
    return result;
};

/**
 * Location Selection Screen
 * Allows user to select a location by moving map or typing address
 */
const LocationSelectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { locationType, initialLocation, returnScreen } = route.params || {}; // 'pickup' or 'dropoff', and screen to return to
    
    const mapRef = useRef(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [region, setRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [hasPermission, setHasPermission] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

    useEffect(() => {
        requestLocationPermission();
        if (initialLocation) {
            setSelectedLocation(initialLocation);
            setAddress(initialLocation.address || "");
            setRegion({
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        }
    }, []);

    // Update location when map region changes (center pin approach)
    useEffect(() => {
        if (!isUpdatingAddress && mapRef.current) {
            const centerLat = region.latitude;
            const centerLon = region.longitude;
            setSelectedLocation({ latitude: centerLat, longitude: centerLon });
        }
    }, [region]);

    // Debounced address suggestions
    useEffect(() => {
        if (searchQuery.length >= 2 && userLocation) {
            const timer = setTimeout(() => {
                loadSuggestions();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, userLocation]);

    // Update address when location changes (debounced)
    useEffect(() => {
        if (selectedLocation && !isUpdatingAddress) {
            const timer = setTimeout(() => {
                updateAddressFromCoordinates(selectedLocation.latitude, selectedLocation.longitude);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedLocation]);

    const loadSuggestions = async () => {
        if (!userLocation) return;
        try {
            const results = await searchAddressSuggestions(
                searchQuery,
                userLocation.latitude,
                userLocation.longitude,
                10 // 10km radius
            );
            setSuggestions(results);
        } catch (error) {
            console.error("Error loading suggestions:", error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                setHasPermission(true);
                const currentLocation = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = currentLocation.coords;
                
                setUserLocation({ latitude, longitude });
                if (!initialLocation) {
                    setRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    });
                    setSelectedLocation({ latitude, longitude });
                }
            }
        } catch (error) {
            console.error("Error getting location:", error);
        }
    };

    const updateAddressFromCoordinates = async (latitude, longitude) => {
        setIsUpdatingAddress(true);
        try {
            const addressText = await reverseGeocode(latitude, longitude);
            setAddress(addressText);
        } catch (error) {
            console.error("Error reverse geocoding:", error);
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
            setIsUpdatingAddress(false);
        }
    };

    const handleSuggestionSelect = async (suggestion) => {
        const fullAddress = suggestion.fullAddress 
            ? `${suggestion.address}, ${suggestion.fullAddress}`
            : suggestion.address;
        
        setSearchQuery(suggestion.address);
        setSuggestions([]);
        setIsUpdatingAddress(true);
        
        setSelectedLocation({
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
        });
        setAddress(fullAddress);
        
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 500);
        }
        setIsUpdatingAddress(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            return;
        }

        setIsSearching(true);
        setSuggestions([]);
        try {
            // Use current map center or user location as base for geocoding
            const centerLat = region.latitude || (userLocation?.latitude);
            const centerLon = region.longitude || (userLocation?.longitude);
            
            const result = await geocodeAddress(searchQuery, centerLat, centerLon);
            setIsUpdatingAddress(true);
            setSelectedLocation({
                latitude: result.latitude,
                longitude: result.longitude,
            });
            setAddress(result.address || searchQuery);
            
            // Center map on searched location
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 500);
            }
            setIsUpdatingAddress(false);
        } catch (error) {
            Alert.alert("Error", "Could not find that address. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedLocation) {
            Alert.alert("Error", "Please select a location");
            return;
        }

        // Prepare the location data to pass back
        const locationData = {
            ...selectedLocation,
            address: address,
            locationType: locationType,
        };

        // Get existing locations from route params to preserve them
        const existingPickupLocation = route.params?.existingPickupLocation || "";
        const existingPickupCoordinates = route.params?.existingPickupCoordinates || null;
        const existingDropoffLocation = route.params?.existingDropoffLocation || "";
        const existingDropoffCoordinates = route.params?.existingDropoffCoordinates || null;

        const returnScreenName = returnScreen || "SearchRide";
        
        // Prepare params with selected location and preserved locations
        const finalParams = {
            selectedLocation: locationData,
        };

        // If we're selecting pickup, preserve dropoff
        if (locationType === 'pickup') {
            finalParams.dropoffLocation = existingDropoffLocation;
            finalParams.dropoffCoordinates = existingDropoffCoordinates;
        } 
        // If we're selecting dropoff, preserve pickup
        else if (locationType === 'dropoff') {
            finalParams.pickupLocation = existingPickupLocation;
            finalParams.pickupCoordinates = existingPickupCoordinates;
        }
        
        // Store the location data temporarily
        locationSelectionResult = finalParams;
        
        // Simply go back - the return screen will check for the stored data
        navigation.goBack();
    };

    const centerOnUser = async () => {
        if (hasPermission) {
            try {
                const currentLocation = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = currentLocation.coords;
                
                setSelectedLocation({ latitude, longitude });
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }, 500);
                }
            } catch (error) {
                Alert.alert("Error", "Could not get your current location");
            }
        } else {
            await requestLocationPermission();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Select {locationType === 'pickup' ? 'Pickup' : 'Dropoff'} Location
                </Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for an address..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={isSearching}
                >
                    <Text style={styles.searchButtonText}>🔍</Text>
                </TouchableOpacity>
            </View>

            {/* Address Suggestions */}
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                        {suggestions.map((suggestion, index) => {
                            const displayAddress = suggestion.fullAddress 
                                ? `${suggestion.address}, ${suggestion.fullAddress}`
                                : suggestion.address;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSuggestionSelect(suggestion)}
                                >
                                    <Text style={styles.suggestionText} numberOfLines={2}>
                                        {displayAddress}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                region={region}
                onRegionChangeComplete={(newRegion) => {
                    setRegion(newRegion);
                }}
                showsUserLocation={hasPermission}
                showsMyLocationButton={false}
            />

            {/* Fixed Center Dot Indicator (Red Dot) */}
            <View style={styles.centerPinContainer} pointerEvents="none">
                <View style={styles.centerDot} />
            </View>

            {/* Selected Address Display */}
            {address && (
                <View style={styles.addressContainer}>
                    <Text style={styles.addressLabel}>Selected Address:</Text>
                    <Text style={styles.addressText}>{address}</Text>
                </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
                    <Text style={styles.controlButtonText}>📍</Text>
                </TouchableOpacity>
            </View>

            {/* Confirm Button */}
            <View style={styles.confirmContainer}>
                <Button
                    title="Confirm Location"
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                />
            </View>
        </SafeAreaView>
    );
};

export default LocationSelectionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    backText: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.textPrimary,
        flex: 1,
        textAlign: "center",
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchButton: {
        marginLeft: 8,
        width: 48,
        height: 48,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    searchButtonText: {
        fontSize: 20,
    },
    map: {
        flex: 1,
    },
    suggestionsContainer: {
        position: "absolute",
        top: 120,
        left: 16,
        right: 16,
        maxHeight: 200,
        backgroundColor: Colors.backgroundLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
        zIndex: 1000,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    suggestionText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    centerPinContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -8,
        marginTop: -8,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    centerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#EA4335", // Red color
        borderWidth: 3,
        borderColor: Colors.backgroundLight,
    },
    addressContainer: {
        position: "absolute",
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: Colors.backgroundLight,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
    },
    addressLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textPrimary,
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
    confirmContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: Colors.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    confirmButton: {
        width: "100%",
    },
});

