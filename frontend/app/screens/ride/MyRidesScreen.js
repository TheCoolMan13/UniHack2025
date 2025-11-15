import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking, Modal, Dimensions } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useAuth } from "../../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { ridesAPI, routesAPI, riderSearchesAPI } from "../../../services/api";
import { decodePolyline } from "../../../utils/polyline";
import { MAP_CONFIG } from "../../../constants/config";

/**
 * My Rides Screen
 * Displays user's requested rides (passenger) and offered rides (driver)
 * Tabs: "Requested rides" / "Offered rides"
 */

const MyRidesScreen = () => {
    const { currentRole, user } = useAuth();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState("requested"); // 'requested', 'offered', or 'saved'
    const [requestedRides, setRequestedRides] = useState([]); // Rides user requested as passenger
    const [offeredRides, setOfferedRides] = useState([]); // Rides user posted as driver
    const [newMatchesCount, setNewMatchesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRide, setSelectedRide] = useState(null);
    const [driverRoute, setDriverRoute] = useState(null);
    const [riderRoute, setRiderRoute] = useState(null);
    const [mapRegion, setMapRegion] = useState(null);
    const mapRef = useRef(null);

    // Fetch rides from API
    useEffect(() => {
        fetchAllRides();
        fetchNewMatchesCount(); // Always fetch to show badge count
    }, [activeTab]);

    const fetchNewMatchesCount = async () => {
        try {
            const response = await riderSearchesAPI.getNewMatches();
            if (response.data.success) {
                const matches = response.data.data.matches || [];
                setNewMatchesCount(matches.length);
            }
        } catch (error) {
            console.error("Fetch new matches count error:", error);
        }
    };

    const fetchAllRides = async () => {
        try {
            setLoading(true);
            
            // Fetch both requested and offered rides in parallel
            const [requestedResponse, offeredResponse] = await Promise.all([
                ridesAPI.getMyRides('passenger').catch(() => ({ data: { success: false, data: { rides: [] } } })),
                ridesAPI.getMyRides('driver').catch(() => ({ data: { success: false, data: { rides: [] } } }))
            ]);

            // Process requested rides (passenger role)
            if (requestedResponse.data.success) {
                const fetchedRequested = requestedResponse.data.data.rides || [];
                const mappedRequested = fetchedRequested.map(ride => {
                    // Map request status to display status
                    let displayStatus = ride.request_status || 'pending';
                    
                    // Normalize status: accepted -> active, rejected/cancelled -> completed
                    if (displayStatus === 'accepted') {
                        displayStatus = 'active';
                    } else if (displayStatus === 'rejected' || displayStatus === 'cancelled') {
                        displayStatus = 'completed';
                    }
                    
                    return {
                        id: ride.id,
                        request_id: ride.request_id,
                        pickup: ride.pickup_address || 'N/A',
                        dropoff: ride.dropoff_address || 'N/A',
                        time: ride.schedule_time || 'N/A',
                        days: Array.isArray(ride.schedule_days) ? ride.schedule_days : (ride.schedule_days ? JSON.parse(ride.schedule_days) : []),
                        status: ride.request_status || 'pending', // Original status: pending, accepted, rejected, cancelled
                        displayStatus: displayStatus, // Display status: pending, active, completed
                        price: `$${parseFloat(ride.price || 0).toFixed(2)}`,
                        driver: ride.driver_name || 'Driver',
                        driver_rating: ride.driver_rating || 0,
                        available_seats: ride.available_seats || 1,
                        originalRide: ride,
                    };
                });
                setRequestedRides(mappedRequested);
            } else {
                setRequestedRides([]);
            }

            // Process offered rides (driver role)
            if (offeredResponse.data.success) {
                const fetchedOffered = offeredResponse.data.data.rides || [];
                const mappedOffered = fetchedOffered.map(ride => {
                    return {
                        id: ride.id,
                        pickup: ride.pickup_address || 'N/A',
                        dropoff: ride.dropoff_address || 'N/A',
                        time: ride.schedule_time || 'N/A',
                        days: Array.isArray(ride.schedule_days) ? ride.schedule_days : (ride.schedule_days ? JSON.parse(ride.schedule_days) : []),
                        status: ride.status || 'active', // active, completed, cancelled
                        price: `$${parseFloat(ride.price || 0).toFixed(2)}`,
                        available_seats: ride.available_seats || 1,
                        request_count: ride.request_count || 0,
                        pending_requests: ride.pending_requests || [], // Include pending requests with passenger details
                        accepted_requests: ride.accepted_requests || [], // Include accepted requests with passenger details
                        originalRide: ride,
                    };
                });
                setOfferedRides(mappedOffered);
            } else {
                setOfferedRides([]);
            }

        } catch (error) {
            console.error("Fetch rides error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to fetch rides";
            Alert.alert("Error", errorMessage);
            setRequestedRides([]);
            setOfferedRides([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllRides();
        fetchNewMatchesCount();
    };

    const handleAcceptRequest = async (rideId, requestId) => {
        try {
            // Ensure requestId is a number
            const requestIdNum = parseInt(requestId, 10);
            if (isNaN(requestIdNum)) {
                Alert.alert("Error", "Invalid request ID");
                return;
            }
            
            const response = await ridesAPI.acceptRequest(rideId, requestIdNum);
            if (response.data.success) {
                Alert.alert("Success", "Ride request accepted!");
                fetchAllRides(); // Refresh list
            } else {
                Alert.alert("Error", response.data.message || "Failed to accept request");
            }
        } catch (error) {
            console.error("Accept request error:", error);
            console.error("Error response:", error.response?.data);
            console.error("Request ID sent:", requestIdNum);
            console.error("Ride ID sent:", rideId);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.errors?.[0]?.msg || 
                                error.response?.data?.errors?.[0]?.message ||
                                error.message || 
                                "Failed to accept request";
            Alert.alert("Error", errorMessage);
        }
    };

    const handleRejectRequest = async (rideId, requestId) => {
        try {
            // Ensure requestId is a number
            const requestIdNum = parseInt(requestId, 10);
            if (isNaN(requestIdNum)) {
                Alert.alert("Error", "Invalid request ID");
                return;
            }
            
            const response = await ridesAPI.rejectRequest(rideId, requestIdNum);
            if (response.data.success) {
                Alert.alert("Success", "Ride request rejected");
                fetchAllRides(); // Refresh list
            } else {
                Alert.alert("Error", response.data.message || "Failed to reject request");
            }
        } catch (error) {
            console.error("Reject request error:", error);
            console.error("Error response:", error.response?.data);
            console.error("Request ID sent:", requestIdNum);
            console.error("Ride ID sent:", rideId);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.errors?.[0]?.msg || 
                                error.response?.data?.errors?.[0]?.message ||
                                error.message || 
                                "Failed to reject request";
            Alert.alert("Error", errorMessage);
        }
    };

    const handleCancelRequest = async (rideId, requestId) => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this accepted ride request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const requestIdNum = parseInt(requestId, 10);
                            if (isNaN(requestIdNum)) {
                                Alert.alert("Error", "Invalid request ID");
                                return;
                            }
                            
                            const response = await ridesAPI.cancelRequest(rideId, requestIdNum);
                            if (response.data.success) {
                                Alert.alert("Success", "Ride request cancelled");
                                fetchAllRides(); // Refresh list
                            } else {
                                Alert.alert("Error", response.data.message || "Failed to cancel request");
                            }
                        } catch (error) {
                            console.error("Cancel request error:", error);
                            console.error("Error response:", error.response?.data);
                            const errorMessage = error.response?.data?.message || 
                                                error.response?.data?.errors?.[0]?.msg || 
                                                error.response?.data?.errors?.[0]?.message ||
                                                error.message || 
                                                "Failed to cancel request";
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteRide = async (rideId) => {
        Alert.alert(
            "Delete Ride",
            "Are you sure you want to delete this ride?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await ridesAPI.deleteRide(rideId);
                            if (response.data.success) {
                                Alert.alert("Success", "Ride deleted successfully");
                                fetchAllRides(); // Refresh list
                            } else {
                                Alert.alert("Error", response.data.message || "Failed to delete ride");
                            }
                        } catch (error) {
                            console.error("Delete ride error:", error);
                            const errorMessage = error.response?.data?.message || error.message || "Failed to delete ride";
                            Alert.alert("Error", errorMessage);
                        }
                    },
                },
            ]
        );
    };

    const handleShowMap = async (ride, request) => {
        try {
            setSelectedRequest(request);
            setSelectedRide(ride);
            setShowMapModal(true);
            
            // Ensure we have valid coordinates
            if (!ride.originalRide || !request) {
                Alert.alert("Error", "Missing ride or request data");
                return;
            }
            
            // Fetch driver route - ensure coordinates are numbers
            const driverOrigin = {
                latitude: parseFloat(ride.originalRide.pickup_latitude),
                longitude: parseFloat(ride.originalRide.pickup_longitude)
            };
            const driverDest = {
                latitude: parseFloat(ride.originalRide.dropoff_latitude),
                longitude: parseFloat(ride.originalRide.dropoff_longitude)
            };
            
            // Fetch rider route - ensure coordinates are numbers
            const riderOrigin = {
                latitude: parseFloat(request.pickup_latitude),
                longitude: parseFloat(request.pickup_longitude)
            };
            const riderDest = {
                latitude: parseFloat(request.dropoff_latitude),
                longitude: parseFloat(request.dropoff_longitude)
            };
            
            // Validate coordinates
            if (isNaN(driverOrigin.latitude) || isNaN(driverOrigin.longitude) ||
                isNaN(driverDest.latitude) || isNaN(driverDest.longitude) ||
                isNaN(riderOrigin.latitude) || isNaN(riderOrigin.longitude) ||
                isNaN(riderDest.latitude) || isNaN(riderDest.longitude)) {
                Alert.alert("Error", "Invalid coordinates");
                return;
            }
            
            // Fetch both routes in parallel
            const [driverRouteRes, riderRouteRes] = await Promise.all([
                routesAPI.calculateRoute(driverOrigin, driverDest).catch(err => {
                    console.error("Error fetching driver route:", err);
                    return { data: { success: false } };
                }),
                routesAPI.calculateRoute(riderOrigin, riderDest).catch(err => {
                    console.error("Error fetching rider route:", err);
                    return { data: { success: false } };
                })
            ]);
            
            // Set routes - API returns { success: true, data: { route: {...} } }
            console.log('Driver route response:', JSON.stringify(driverRouteRes.data, null, 2));
            if (driverRouteRes.data.success && driverRouteRes.data.data) {
                const route = driverRouteRes.data.data.route || driverRouteRes.data.data;
                console.log('Driver route object:', route);
                if (route && route.polyline) {
                    console.log('✅ Driver route loaded, polyline length:', route.polyline.length);
                    setDriverRoute(route);
                } else {
                    console.warn('❌ Driver route missing polyline. Route object:', route);
                    // Still set it so fallback line shows
                    setDriverRoute(null);
                }
            } else {
                console.warn('❌ Driver route API failed:', driverRouteRes.data);
                setDriverRoute(null);
            }
            
            console.log('Rider route response:', JSON.stringify(riderRouteRes.data, null, 2));
            if (riderRouteRes.data.success && riderRouteRes.data.data) {
                const route = riderRouteRes.data.data.route || riderRouteRes.data.data;
                console.log('Rider route object:', route);
                if (route && route.polyline) {
                    console.log('✅ Rider route loaded, polyline length:', route.polyline.length);
                    setRiderRoute(route);
                } else {
                    console.warn('❌ Rider route missing polyline. Route object:', route);
                    setRiderRoute(null);
                }
            } else {
                console.warn('❌ Rider route API failed:', riderRouteRes.data);
                setRiderRoute(null);
            }
            
            // Calculate map region to fit both routes
            const allCoords = [
                driverOrigin, driverDest, riderOrigin, riderDest
            ];
            const lats = allCoords.map(c => c.latitude);
            const lngs = allCoords.map(c => c.longitude);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            const latDelta = (maxLat - minLat) * 1.5;
            const lngDelta = (maxLng - minLng) * 1.5;
            
            setMapRegion({
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(latDelta, 0.01),
                longitudeDelta: Math.max(lngDelta, 0.01),
            });
        } catch (error) {
            console.error("Error loading map:", error);
            Alert.alert("Error", "Failed to load map routes: " + (error.message || "Unknown error"));
        }
    };

    return (
        <View style={styles.container}>
            <Header title="My Rides" showBack={false} showStatusBar={true} />
            
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "requested" && styles.tabActive]}
                    onPress={() => setActiveTab("requested")}
                >
                    <Text
                        style={[styles.tabText, activeTab === "requested" && styles.tabTextActive]}
                    >
                        Requested Rides
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "offered" && styles.tabActive]}
                    onPress={() => setActiveTab("offered")}
                >
                    <Text
                        style={[styles.tabText, activeTab === "offered" && styles.tabTextActive]}
                    >
                        Offered Rides
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "saved" && styles.tabActive]}
                    onPress={() => setActiveTab("saved")}
                >
                    <View style={styles.tabWithBadge}>
                        <Text
                            style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}
                        >
                            Saved Searches
                        </Text>
                        {newMatchesCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{newMatchesCount}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading rides...</Text>
                    </View>
                ) : activeTab === "saved" ? (
                    <View style={styles.savedSearchesContainer}>
                        {newMatchesCount > 0 && (
                            <Card style={styles.newMatchesBanner}>
                                <View style={styles.newMatchesContent}>
                                    <Text style={styles.newMatchesText}>
                                        🎉 You have {newMatchesCount} new match{newMatchesCount > 1 ? 'es' : ''}!
                                    </Text>
                                    <Button
                                        title="View Matches"
                                        onPress={() => navigation.navigate("NewMatches")}
                                        style={styles.viewMatchesButton}
                                    />
                                </View>
                            </Card>
                        )}
                        <Card style={styles.savedSearchesCard}>
                            <Text style={styles.savedSearchesTitle}>Saved Searches</Text>
                            <Text style={styles.savedSearchesText}>
                                View and manage your saved searches for future matches.
                            </Text>
                            <Button
                                title="View Saved Searches"
                                onPress={() => navigation.navigate("SavedSearches")}
                                style={styles.viewSavedSearchesButton}
                            />
                        </Card>
                    </View>
                ) : (activeTab === "requested" ? requestedRides : offeredRides).length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No {activeTab === "requested" ? "requested" : "offered"} rides
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === "requested"
                                ? 'Search for rides to request one!'
                                : 'Post a ride to get started!'}
                        </Text>
                    </View>
                ) : (
                    (activeTab === "requested" ? requestedRides : offeredRides).map((ride) => (
                        <Card key={activeTab === "requested" ? ride.request_id || ride.id : ride.id} style={styles.rideCard}>
                            <View style={styles.rideHeader}>
                                <Text style={styles.rideTitle}>
                                    {ride.pickup} → {ride.dropoff}
                                </Text>
                                {/* Status badge - show for requested rides */}
                                {activeTab === "requested" && (
                                <View
                                    style={[
                                        styles.statusBadge,
                                            ride.displayStatus === "active" && styles.statusBadgeActive,
                                            ride.displayStatus === "pending" && styles.statusBadgePending,
                                            ride.displayStatus === "completed" && styles.statusBadgeCompleted,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                                ride.displayStatus === "active" && styles.statusTextActive,
                                                ride.displayStatus === "pending" && styles.statusTextPending,
                                                ride.displayStatus === "completed" && styles.statusTextCompleted,
                                            ]}
                                        >
                                            {ride.status === 'accepted' ? 'Active' : 
                                             ride.status === 'pending' ? 'Pending' : 
                                             ride.status === 'rejected' ? 'Rejected' : 
                                             ride.status === 'cancelled' ? 'Cancelled' : 
                                             ride.status}
                                        </Text>
                                    </View>
                                )}
                                {/* Status badge for offered rides */}
                                {activeTab === "offered" && (
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            ride.status === "active" && styles.statusBadgeActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                ride.status === "active" && styles.statusTextActive,
                                        ]}
                                    >
                                        {ride.status}
                                    </Text>
                                </View>
                                )}
                            </View>

                            <View style={styles.rideInfo}>
                                <Text style={styles.infoLabel}>Time:</Text>
                                <Text style={styles.infoValue}>{ride.time}</Text>
                            </View>

                            <View style={styles.rideInfo}>
                                <Text style={styles.infoLabel}>Days:</Text>
                                <Text style={styles.infoValue}>
                                    {Array.isArray(ride.days) ? ride.days.join(", ") : ride.days}
                                </Text>
                            </View>

                            {/* Show driver info for requested rides */}
                            {activeTab === "requested" && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Driver:</Text>
                                    <Text style={styles.infoValue}>
                                        {ride.driver} {ride.driver_rating > 0 && `⭐ ${ride.driver_rating}`}
                                    </Text>
                                </View>
                            )}

                            {/* Show request count for offered rides */}
                            {activeTab === "offered" && ride.request_count > 0 && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Requests:</Text>
                                    <Text style={styles.infoValue}>{ride.request_count} pending</Text>
                                </View>
                            )}

                            {/* Show pending requests for drivers */}
                            {activeTab === "offered" && ride.pending_requests && ride.pending_requests.length > 0 && (
                                <View style={styles.requestsContainer}>
                                    <Text style={styles.requestsTitle}>
                                        {ride.pending_requests.length} Pending Request{ride.pending_requests.length > 1 ? 's' : ''}
                                    </Text>
                                    {ride.pending_requests.map((request, idx) => (
                                        <View key={request.id || idx} style={styles.requestItem}>
                                            <View style={styles.requestHeader}>
                                                <View>
                                                    <Text style={styles.requestName}>
                                                        {request.passenger_name || 'Passenger'}
                                                    </Text>
                                                    {request.passenger_rating > 0 && (
                                                        <Text style={styles.requestRating}>
                                                            ⭐ {parseFloat(request.passenger_rating).toFixed(1)}
                                                        </Text>
                                                    )}
                                                </View>
                                                {request.passenger_phone && (
                                                    <TouchableOpacity
                                                        style={styles.phoneButton}
                                                        onPress={() => {
                                                            // Open phone dialer
                                                            const phoneNumber = request.passenger_phone.replace(/\D/g, '');
                                                            Alert.alert(
                                                                "Call Passenger",
                                                                `Call ${request.passenger_name} at ${request.passenger_phone}?`,
                                                                [
                                                                    { text: "Cancel", style: "cancel" },
                                                                    { 
                                                                        text: "Call", 
                                                                        onPress: () => {
                                                                            // Open phone dialer
                                                                            Linking.openURL(`tel:${phoneNumber}`);
                                                                        }
                                                                    }
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        <Text style={styles.phoneButtonText}>📞 Call</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <View style={styles.requestRoute}>
                                                <Text style={styles.requestRouteLabel}>Pickup:</Text>
                                                <Text style={styles.requestRouteText}>
                                                    {request.pickup_address || 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.requestRoute}>
                                                <Text style={styles.requestRouteLabel}>Dropoff:</Text>
                                                <Text style={styles.requestRouteText}>
                                                    {request.dropoff_address || 'N/A'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.viewMapButton}
                                                onPress={() => handleShowMap(ride, request)}
                                            >
                                                <Text style={styles.viewMapButtonText}>🗺️ View Routes on Map</Text>
                                            </TouchableOpacity>
                                            <View style={styles.requestActions}>
                                                <TouchableOpacity
                                                    style={[styles.acceptButton, { backgroundColor: Colors.secondary }]}
                                                    onPress={() => handleAcceptRequest(ride.id, request.id)}
                                                >
                                                    <Text style={styles.acceptButtonText}>Accept</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.rejectButton, { backgroundColor: Colors.error + "20" }]}
                                                    onPress={() => handleRejectRequest(ride.id, request.id)}
                                                >
                                                    <Text style={[styles.rejectButtonText, { color: Colors.error }]}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Show accepted requests for drivers */}
                            {activeTab === "offered" && ride.accepted_requests && ride.accepted_requests.length > 0 && (
                                <View style={styles.requestsContainer}>
                                    <Text style={styles.requestsTitle}>
                                        {ride.accepted_requests.length} Accepted Rider{ride.accepted_requests.length > 1 ? 's' : ''}
                                    </Text>
                                    {ride.accepted_requests.map((request, idx) => (
                                        <View key={request.id || idx} style={[styles.requestItem, styles.acceptedRequestItem]}>
                                            <View style={styles.requestHeader}>
                                                <View>
                                                    <Text style={styles.requestName}>
                                                        {request.passenger_name || 'Passenger'}
                                                    </Text>
                                                    {request.passenger_rating > 0 && (
                                                        <Text style={styles.requestRating}>
                                                            ⭐ {parseFloat(request.passenger_rating).toFixed(1)}
                                                        </Text>
                                                    )}
                                                </View>
                                                {request.passenger_phone && (
                                                    <TouchableOpacity
                                                        style={styles.phoneButton}
                                                        onPress={() => {
                                                            const phoneNumber = request.passenger_phone.replace(/\D/g, '');
                                                            Alert.alert(
                                                                "Call Passenger",
                                                                `Call ${request.passenger_name} at ${request.passenger_phone}?`,
                                                                [
                                                                    { text: "Cancel", style: "cancel" },
                                                                    { 
                                                                        text: "Call", 
                                                                        onPress: () => {
                                                                            Linking.openURL(`tel:${phoneNumber}`);
                                                                        }
                                                                    }
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        <Text style={styles.phoneButtonText}>📞 Call</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <View style={styles.requestRoute}>
                                                <Text style={styles.requestRouteLabel}>Pickup:</Text>
                                                <Text style={styles.requestRouteText}>
                                                    {request.pickup_address || 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.requestRoute}>
                                                <Text style={styles.requestRouteLabel}>Dropoff:</Text>
                                                <Text style={styles.requestRouteText}>
                                                    {request.dropoff_address || 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.requestActions}>
                                                <TouchableOpacity
                                                    style={[styles.cancelButton, { backgroundColor: Colors.error + "20" }]}
                                                    onPress={() => handleCancelRequest(ride.id, request.id)}
                                                >
                                                    <Text style={[styles.cancelButtonText, { color: Colors.error }]}>Cancel Request</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.rideFooter}>
                                <Text style={styles.price}>{ride.price}</Text>
                                {activeTab === "offered" && (
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteRide(ride.id)}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>

            {/* Map Modal for viewing routes */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowMapModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Route Map</Text>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => {
                                setShowMapModal(false);
                                setSelectedRequest(null);
                                setSelectedRide(null);
                                setDriverRoute(null);
                                setRiderRoute(null);
                            }}
                        >
                            <Text style={styles.closeModalButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {mapRegion && (
                        <MapView
                            ref={mapRef}
                            style={styles.modalMap}
                            region={mapRegion}
                            onRegionChangeComplete={setMapRegion}
                        >
                            {/* Driver's route markers */}
                            {selectedRide && selectedRide.originalRide && (
                                <>
                                    <Marker
                                        coordinate={{
                                            latitude: parseFloat(selectedRide.originalRide.pickup_latitude) || 0,
                                            longitude: parseFloat(selectedRide.originalRide.pickup_longitude) || 0
                                        }}
                                        title="Your Start"
                                        pinColor={Colors.secondary}
                                    />
                                    <Marker
                                        coordinate={{
                                            latitude: parseFloat(selectedRide.originalRide.dropoff_latitude) || 0,
                                            longitude: parseFloat(selectedRide.originalRide.dropoff_longitude) || 0
                                        }}
                                        title="Your End"
                                        pinColor={Colors.secondary}
                                    />
                                    {driverRoute && driverRoute.polyline ? (
                                        <Polyline
                                            key="driver-route-polyline"
                                            coordinates={decodePolyline(driverRoute.polyline)}
                                            strokeColor={Colors.secondary}
                                            strokeWidth={4}
                                        />
                                    ) : (
                                        <Polyline
                                            key="driver-route-fallback"
                                            coordinates={[
                                                {
                                                    latitude: parseFloat(selectedRide.originalRide.pickup_latitude) || 0,
                                                    longitude: parseFloat(selectedRide.originalRide.pickup_longitude) || 0
                                                },
                                                {
                                                    latitude: parseFloat(selectedRide.originalRide.dropoff_latitude) || 0,
                                                    longitude: parseFloat(selectedRide.originalRide.dropoff_longitude) || 0
                                                }
                                            ]}
                                            strokeColor={Colors.secondary}
                                            strokeWidth={3}
                                            lineDashPattern={[5, 5]}
                                        />
                                    )}
                                </>
                            )}
                            
                            {/* Rider's route markers */}
                            {selectedRequest && selectedRequest.pickup_latitude && selectedRequest.pickup_longitude && (
                                <>
                                    <Marker
                                        coordinate={{
                                            latitude: parseFloat(selectedRequest.pickup_latitude) || 0,
                                            longitude: parseFloat(selectedRequest.pickup_longitude) || 0
                                        }}
                                        title={`${selectedRequest.passenger_name || 'Passenger'}'s Pickup`}
                                        pinColor={Colors.primary}
                                    />
                                    <Marker
                                        coordinate={{
                                            latitude: parseFloat(selectedRequest.dropoff_latitude) || 0,
                                            longitude: parseFloat(selectedRequest.dropoff_longitude) || 0
                                        }}
                                        title={`${selectedRequest.passenger_name || 'Passenger'}'s Dropoff`}
                                        pinColor={Colors.error}
                                    />
                                    {riderRoute && riderRoute.polyline && (
                                        <Polyline
                                            coordinates={decodePolyline(riderRoute.polyline)}
                                            strokeColor={Colors.primary}
                                            strokeWidth={4}
                                        />
                                    )}
                                    {/* Fallback: Draw straight line if no polyline */}
                                    {(!riderRoute || !riderRoute.polyline) && (
                                        <Polyline
                                            coordinates={[
                                                {
                                                    latitude: parseFloat(selectedRequest.pickup_latitude) || 0,
                                                    longitude: parseFloat(selectedRequest.pickup_longitude) || 0
                                                },
                                                {
                                                    latitude: parseFloat(selectedRequest.dropoff_latitude) || 0,
                                                    longitude: parseFloat(selectedRequest.dropoff_longitude) || 0
                                                }
                                            ]}
                                            strokeColor={Colors.primary}
                                            strokeWidth={3}
                                            lineDashPattern={[5, 5]}
                                        />
                                    )}
                                </>
                            )}
                        </MapView>
                    )}
                    
                    <View style={styles.mapLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: Colors.secondary }]} />
                            <Text style={styles.legendText}>Your Route</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.legendText}>Rider's Route</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default MyRidesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: "600",
    },
    tabTextActive: {
        color: Colors.primary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    rideCard: {
        marginBottom: 16,
    },
    rideHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    rideTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.surface,
    },
    statusBadgeActive: {
        backgroundColor: Colors.secondary + "20",
    },
    statusBadgePending: {
        backgroundColor: "#FFA50020", // Orange tint
    },
    statusBadgeCompleted: {
        backgroundColor: Colors.textSecondary + "20",
    },
    statusText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    statusTextActive: {
        color: Colors.secondary,
    },
    statusTextPending: {
        color: "#FFA500", // Orange
    },
    statusTextCompleted: {
        color: Colors.textSecondary,
    },
    rideInfo: {
        flexDirection: "row",
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        width: 80,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.textPrimary,
        flex: 1,
    },
    rideFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    price: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.primary,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.primary,
    },
    actionButtonText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: "600",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    requestsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    requestsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    requestsHint: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: "italic",
    },
    requestItem: {
        padding: 12,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        marginTop: 8,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    requestName: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    requestRating: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    phoneButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.primary + "20",
    },
    phoneButtonText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600",
    },
    requestRoute: {
        marginBottom: 8,
    },
    requestRouteLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
        fontWeight: "600",
    },
    requestRouteText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    requestActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    acceptButtonText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: "600",
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    deleteButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.error + "20",
    },
    deleteButtonText: {
        fontSize: 14,
        color: Colors.error,
        fontWeight: "600",
    },
    viewMapButton: {
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.primary + "20",
        alignItems: "center",
    },
    viewMapButtonText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600",
    },
    acceptedRequestItem: {
        backgroundColor: Colors.secondary + "15",
        borderLeftWidth: 3,
        borderLeftColor: Colors.secondary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: Colors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
    },
    closeModalButton: {
        padding: 8,
    },
    closeModalButtonText: {
        fontSize: 24,
        color: Colors.textSecondary,
    },
    modalMap: {
        flex: 1,
    },
    mapLegend: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 16,
        backgroundColor: Colors.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendColor: {
        width: 20,
        height: 4,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    tabWithBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    badge: {
        backgroundColor: Colors.secondary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    savedSearchesContainer: {
        padding: 16,
    },
    newMatchesBanner: {
        backgroundColor: Colors.secondary + '20',
        borderColor: Colors.secondary,
        borderWidth: 2,
        marginBottom: 16,
    },
    newMatchesContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    newMatchesText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        flex: 1,
    },
    viewMatchesButton: {
        marginLeft: 12,
        paddingHorizontal: 16,
    },
    savedSearchesCard: {
        padding: 20,
    },
    savedSearchesTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    savedSearchesText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
        lineHeight: 20,
    },
    viewSavedSearchesButton: {
        marginTop: 8,
    },
});

