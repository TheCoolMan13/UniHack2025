import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Card from "../../../components/common/Card";
import Header from "../../../components/common/Header";
import { Colors } from "../../../constants/colors";

/**
 * Map Screen
 * Displays map with user location and available rides
 */

const MapScreen = () => {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        requestLocationPermission();
    }, []);

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

    // Mock ride data for demonstration
    const mockRides = [
        {
            id: "1",
            pickup: { latitude: 37.78825, longitude: -122.4324 },
            dropoff: { latitude: 37.78425, longitude: -122.4094 },
            driver: "John Doe",
            time: "7:30 AM",
        },
        {
            id: "2",
            pickup: { latitude: 37.79025, longitude: -122.4304 },
            dropoff: { latitude: 37.78225, longitude: -122.4114 },
            driver: "Jane Smith",
            time: "8:00 AM",
        },
    ];

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

                {/* Mock ride markers */}
                {mockRides.map((ride) => (
                    <React.Fragment key={ride.id}>
                        <Marker
                            coordinate={ride.pickup}
                            title={`Pickup - ${ride.driver}`}
                            description={ride.time}
                            pinColor={Colors.secondary}
                        />
                        <Marker
                            coordinate={ride.dropoff}
                            title={`Dropoff - ${ride.driver}`}
                            pinColor={Colors.error}
                        />
                        <Polyline
                            coordinates={[ride.pickup, ride.dropoff]}
                            strokeColor={Colors.primary}
                            strokeWidth={3}
                        />
                    </React.Fragment>
                ))}
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
                <Text style={styles.infoText}>
                    {mockRides.length} rides available in your area
                </Text>
            </Card>
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
});

