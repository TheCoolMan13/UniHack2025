import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Card from "../../../components/common/Card";
import Header from "../../../components/common/Header";
import { Colors } from "../../../constants/colors";
import { ridesAPI } from "../../../services/api";
import { MAP_CONFIG } from "../../../constants/config";

/**
 * Map Screen
 * Displays map with user location and available rides
 */

const MapScreen = () => {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState({
        latitude: MAP_CONFIG.DEFAULT_LATITUDE,
        longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
        latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
        longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
    });
    const [hasPermission, setHasPermission] = useState(false);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRide, setSelectedRide] = useState(null);

    useEffect(() => {
        requestLocationPermission();
        fetchActiveRides();
    }, []);

    /**
     * Fetch active rides from API
     */
    const fetchActiveRides = async () => {
        try {
            setLoading(true);
            const response = await ridesAPI.getActiveRides();
            
            if (response.data.success) {
                const fetchedRides = response.data.data.rides || [];
                setRides(fetchedRides);
            } else {
                console.error("Failed to fetch rides:", response.data.message);
                setRides([]);
            }
        } catch (error) {
            console.error("Fetch active rides error:", error);
            // Don't show alert for map - just log error
            setRides([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Request location permissions and get current location
     */
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required to use the map feature."
                );
                setHasPermission(false);
                return;
            }

            setHasPermission(true);
            const currentLocation = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLocation.coords;

            setLocation({ latitude, longitude });
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        } catch (error) {
            console.error("Error getting location:", error);
            Alert.alert("Error", "Failed to get your location.");
        }
    };

    /**
     * Center map on user's current location
     */
    const centerOnUser = async () => {
        if (hasPermission && location) {
            setRegion({
                ...region,
                latitude: location.latitude,
                longitude: location.longitude,
            });
        } else {
            await requestLocationPermission();
        }
    };

    /**
     * Handle marker press to show ride details
     */
    const handleMarkerPress = (ride) => {
        setSelectedRide(ride);
    };

    return (
        <View style={styles.container}>
            <Header title="Map" showBack={false} />
            <MapView
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation={hasPermission}
                showsMyLocationButton={false}
            >
                {/* User location marker */}
                {location && (
                    <Marker
                        coordinate={location}
                        title="Your Location"
                        pinColor={Colors.primary}
                    />
                )}

                {/* Real ride markers */}
                {rides.map((ride) => {
                    const pickupCoord = {
                        latitude: ride.pickup_latitude,
                        longitude: ride.pickup_longitude,
                    };
                    const dropoffCoord = {
                        latitude: ride.dropoff_latitude,
                        longitude: ride.dropoff_longitude,
                    };

                    return (
                        <React.Fragment key={ride.id}>
                            <Marker
                                coordinate={pickupCoord}
                                title={`Pickup - ${ride.driver_name || 'Driver'}`}
                                description={`${ride.schedule_time} | $${ride.price.toFixed(2)}`}
                                pinColor={Colors.secondary}
                                onPress={() => handleMarkerPress(ride)}
                            />
                            <Marker
                                coordinate={dropoffCoord}
                                title={`Dropoff - ${ride.driver_name || 'Driver'}`}
                                description={`${ride.schedule_time} | $${ride.price.toFixed(2)}`}
                                pinColor={Colors.error}
                                onPress={() => handleMarkerPress(ride)}
                            />
                            <Polyline
                                coordinates={[pickupCoord, dropoffCoord]}
                                strokeColor={MAP_CONFIG.ROUTE_COLOR}
                                strokeWidth={MAP_CONFIG.ROUTE_WIDTH}
                            />
                        </React.Fragment>
                    );
                })}
            </MapView>

            {/* Map Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
                    <Text style={styles.controlButtonText}>📍</Text>
                </TouchableOpacity>
            </View>

            {/* Info Card */}
            <Card style={styles.infoCard}>
                <Text style={styles.infoTitle}>Available Rides</Text>
                {loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.infoText}>Loading rides...</Text>
                    </View>
                ) : (
                    <Text style={styles.infoText}>
                        {rides.length} {rides.length === 1 ? 'ride' : 'rides'} available
                    </Text>
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
                        {selectedRide.driver_name || 'Driver'}
                    </Text>
                    <Text style={styles.rideDetailsRoute}>
                        {selectedRide.pickup_address} → {selectedRide.dropoff_address}
                    </Text>
                    <View style={styles.rideDetailsInfo}>
                        <Text style={styles.rideDetailsText}>
                            ⏰ {selectedRide.schedule_time}
                        </Text>
                        <Text style={styles.rideDetailsText}>
                            💰 ${selectedRide.price.toFixed(2)}
                        </Text>
                        <Text style={styles.rideDetailsText}>
                            🪑 {selectedRide.available_seats} seat{selectedRide.available_seats > 1 ? 's' : ''}
                        </Text>
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
        gap: 8,
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

