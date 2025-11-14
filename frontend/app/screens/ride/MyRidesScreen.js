import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";

/**
 * My Rides Screen
 * Displays user's posted rides (driver) or requested rides (passenger)
 */

const MyRidesScreen = () => {
    const { currentRole } = useAuth();
    const [activeTab, setActiveTab] = useState("active"); // 'active', 'pending', 'completed'

    // Mock rides data
    const mockRides = [
        {
            id: "1",
            pickup: "123 Main St",
            dropoff: "456 Oak Ave",
            time: "7:30 AM",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            status: "active",
            price: "$10.00",
            driver: "John Doe",
            passenger: "You",
        },
    ];

    const filteredRides = mockRides.filter((ride) => ride.status === activeTab);

    return (
        <View style={styles.container}>
            <Header title="My Rides" showBack={false} />
            
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

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredRides.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {activeTab} rides</Text>
                    </View>
                ) : (
                    filteredRides.map((ride) => (
                        <Card key={ride.id} style={styles.rideCard}>
                            <View style={styles.rideHeader}>
                                <Text style={styles.rideTitle}>
                                    {ride.pickup} → {ride.dropoff}
                                </Text>
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
                            </View>

                            <View style={styles.rideInfo}>
                                <Text style={styles.infoLabel}>Time:</Text>
                                <Text style={styles.infoValue}>{ride.time}</Text>
                            </View>

                            <View style={styles.rideInfo}>
                                <Text style={styles.infoLabel}>Days:</Text>
                                <Text style={styles.infoValue}>{ride.days.join(", ")}</Text>
                            </View>

                            {currentRole === "driver" && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Passenger:</Text>
                                    <Text style={styles.infoValue}>{ride.passenger}</Text>
                                </View>
                            )}

                            {currentRole === "passenger" && (
                                <View style={styles.rideInfo}>
                                    <Text style={styles.infoLabel}>Driver:</Text>
                                    <Text style={styles.infoValue}>{ride.driver}</Text>
                                </View>
                            )}

                            <View style={styles.rideFooter}>
                                <Text style={styles.price}>{ride.price}</Text>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>View Details</Text>
                                </TouchableOpacity>
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
});

