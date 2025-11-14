import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { ridesAPI } from "../../../services/api";

/**
 * My Rides Screen
 * Displays user's requested rides (passenger) and offered rides (driver)
 * Tabs: "Requested rides" / "Offered rides"
 */

const MyRidesScreen = () => {
    const { currentRole, user } = useAuth();
    const [activeTab, setActiveTab] = useState("requested"); // 'requested' or 'offered'
    const [requestedRides, setRequestedRides] = useState([]); // Rides user requested as passenger
    const [offeredRides, setOfferedRides] = useState([]); // Rides user posted as driver
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch rides from API
    useEffect(() => {
        fetchAllRides();
    }, [activeTab]);

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
    };

    const handleAcceptRequest = async (rideId, requestId) => {
        try {
            const response = await ridesAPI.acceptRequest(rideId, requestId);
            if (response.data.success) {
                Alert.alert("Success", "Ride request accepted!");
                fetchAllRides(); // Refresh list
            } else {
                Alert.alert("Error", response.data.message || "Failed to accept request");
            }
        } catch (error) {
            console.error("Accept request error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to accept request";
            Alert.alert("Error", errorMessage);
        }
    };

    const handleRejectRequest = async (rideId, requestId) => {
        try {
            const response = await ridesAPI.rejectRequest(rideId, requestId);
            if (response.data.success) {
                Alert.alert("Success", "Ride request rejected");
                fetchAllRides(); // Refresh list
            } else {
                Alert.alert("Error", response.data.message || "Failed to reject request");
            }
        } catch (error) {
            console.error("Reject request error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to reject request";
            Alert.alert("Error", errorMessage);
        }
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

                            {/* Show ride requests hint for drivers */}
                            {activeTab === "offered" && ride.request_count > 0 && (
                                <View style={styles.requestsContainer}>
                                    <Text style={styles.requestsTitle}>
                                        {ride.request_count} Pending Request{ride.request_count > 1 ? 's' : ''}
                                    </Text>
                                    <Text style={styles.requestsHint}>
                                        View ride details to see and manage requests
                                    </Text>
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
    },
    requestInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    requestName: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    requestRating: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    requestActions: {
        flexDirection: "row",
        gap: 8,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 6,
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 6,
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
});

