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
 * Displays user's posted rides (driver) or requested rides (passenger)
 */

const MyRidesScreen = () => {
    const { currentRole, user } = useAuth();
    const [activeTab, setActiveTab] = useState("active"); // 'active', 'pending', 'completed'
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch rides from API
    useEffect(() => {
        fetchRides();
    }, [currentRole, activeTab]);

    const fetchRides = async () => {
        try {
            setLoading(true);
            const response = await ridesAPI.getMyRides(currentRole);
            
            if (response.data.success) {
                const fetchedRides = response.data.data.rides || [];
                
                // Map API response to UI format and filter by status
                const mappedRides = fetchedRides.map(ride => {
                    // Determine status based on ride status and request status
                    let status = ride.status || 'active';
                    if (currentRole === 'passenger' && ride.request_status) {
                        status = ride.request_status; // pending, accepted, rejected, cancelled
                    }
                    
                    return {
                        id: ride.id,
                        request_id: ride.request_id,
                        pickup: ride.pickup_address,
                        dropoff: ride.dropoff_address,
                        time: ride.schedule_time,
                        days: ride.schedule_days || [],
                        status: status,
                        price: `$${parseFloat(ride.price || 0).toFixed(2)}`,
                        driver: ride.driver_name || 'Driver',
                        driver_rating: ride.driver_rating || 0,
                        passenger: 'You',
                        available_seats: ride.available_seats || 1,
                        request_count: ride.request_count || 0,
                        requests: ride.requests || [],
                        // Keep original ride data for actions
                        originalRide: ride,
                    };
                });

                // Filter by active tab
                let filtered = mappedRides;
                if (activeTab === 'active') {
                    filtered = mappedRides.filter(r => r.status === 'active' || r.status === 'accepted');
                } else if (activeTab === 'pending') {
                    filtered = mappedRides.filter(r => r.status === 'pending');
                } else if (activeTab === 'completed') {
                    filtered = mappedRides.filter(r => r.status === 'completed' || r.status === 'cancelled');
                }

                setRides(filtered);
            } else {
                Alert.alert("Error", response.data.message || "Failed to fetch rides");
                setRides([]);
            }
        } catch (error) {
            console.error("Fetch rides error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to fetch rides";
            Alert.alert("Error", errorMessage);
            setRides([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRides();
    };

    const handleAcceptRequest = async (rideId, requestId) => {
        try {
            const response = await ridesAPI.acceptRequest(rideId, requestId);
            if (response.data.success) {
                Alert.alert("Success", "Ride request accepted!");
                fetchRides(); // Refresh list
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
                fetchRides(); // Refresh list
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
                                fetchRides(); // Refresh list
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
                    style={[styles.tab, activeTab === "active" && styles.tabActive]}
                    onPress={() => setActiveTab("active")}
                >
                    <Text
                        style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}
                    >
                        Active
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "pending" && styles.tabActive]}
                    onPress={() => setActiveTab("pending")}
                >
                    <Text
                        style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}
                    >
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "completed" && styles.tabActive]}
                    onPress={() => setActiveTab("completed")}
                >
                    <Text
                        style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}
                    >
                        Completed
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
                ) : rides.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {activeTab} rides</Text>
                        <Text style={styles.emptySubtext}>
                            {currentRole === 'driver' 
                                ? 'Post a ride to get started!' 
                                : 'Search for rides to request one!'}
                        </Text>
                    </View>
                ) : (
                    rides.map((ride) => (
                        <Card key={ride.id} style={styles.rideCard}>
                            <View style={styles.rideHeader}>
                                <Text style={styles.rideTitle}>
                                    {ride.pickup} → {ride.dropoff}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        ride.status === "active" && styles.statusBadgeActive,
                                        ride.status === "accepted" && styles.statusBadgeActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            (ride.status === "active" || ride.status === "accepted") && styles.statusTextActive,
                                        ]}
                                    >
                                        {ride.status}
                                    </Text>
                                </View>
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

                            {currentRole === "passenger" && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Driver:</Text>
                                    <Text style={styles.infoValue}>
                                        {ride.driver} {ride.driver_rating > 0 && `⭐ ${ride.driver_rating}`}
                                    </Text>
                                </View>
                            )}

                            {currentRole === "driver" && ride.request_count > 0 && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Requests:</Text>
                                    <Text style={styles.infoValue}>{ride.request_count} pending</Text>
                                </View>
                            )}

                            {/* Show ride requests for drivers - fetch details if needed */}
                            {currentRole === "driver" && ride.request_count > 0 && (
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
                                {currentRole === "driver" && (
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
    statusText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: "600",
    },
    statusTextActive: {
        color: Colors.secondary,
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

