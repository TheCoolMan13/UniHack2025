import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { riderSearchesAPI, ridesAPI } from "../../../services/api";

/**
 * New Matches Screen
 * Displays new matches for saved searches
 */
const NewMatchesScreen = () => {
    const navigation = useNavigation();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNewMatches();
    }, []);

    const fetchNewMatches = async () => {
        try {
            setLoading(true);
            const response = await riderSearchesAPI.getNewMatches();
            if (response.data.success) {
                const fetchedMatches = response.data.data.matches || [];
                setMatches(fetchedMatches);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load matches");
            }
        } catch (error) {
            console.error("Fetch new matches error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to load matches";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNewMatches();
    };

    const handleRequestRide = async (rideId, matchId) => {
        try {
            const response = await ridesAPI.requestRide(rideId);
            if (response.data.success) {
                // Mark match as requested
                await riderSearchesAPI.markMatchViewed(matchId).catch(() => {});
                Alert.alert("Success", "Ride request sent! The driver will be notified.");
                fetchNewMatches(); // Refresh to remove requested match
            } else {
                Alert.alert("Error", response.data.message || "Failed to request ride");
            }
        } catch (error) {
            console.error("Request ride error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to request ride";
            Alert.alert("Error", errorMessage);
        }
    };

    const handleDismissMatch = async (matchId) => {
        Alert.alert(
            "Dismiss Match",
            "Are you sure you want to dismiss this match?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Dismiss",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await riderSearchesAPI.dismissMatch(matchId);
                            if (response.data.success) {
                                fetchNewMatches(); // Refresh to remove dismissed match
                            } else {
                                Alert.alert("Error", response.data.message || "Failed to dismiss match");
                            }
                        } catch (error) {
                            console.error("Dismiss match error:", error);
                            const errorMessage = error.response?.data?.message || error.message || "Failed to dismiss match";
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const handleViewMatch = async (matchId) => {
        // Mark as viewed when user views the match
        try {
            await riderSearchesAPI.markMatchViewed(matchId);
        } catch (error) {
            console.error("Mark match viewed error:", error);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <Header title="New Matches" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="New Matches" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {matches.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No new matches</Text>
                        <Text style={styles.emptySubtext}>
                            When drivers post rides that match your saved searches, they'll appear here.
                        </Text>
                    </Card>
                ) : (
                    matches.map((match) => (
                        <Card key={match.match_id} style={styles.matchCard}>
                            <TouchableOpacity
                                onPress={() => handleViewMatch(match.match_id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.matchHeader}>
                                    <View>
                                        <Text style={styles.driverName}>{match.driver_name || "Driver"}</Text>
                                        <Text style={styles.rating}>⭐ {match.driver_rating || "0.0"}</Text>
                                    </View>
                                    <View style={styles.matchScoreContainer}>
                                        <Text style={styles.matchScoreLabel}>Match</Text>
                                        <Text style={styles.matchScore}>{match.match_score}/100</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.routeText}>
                                    📍 {match.pickup_address}
                                </Text>
                                <Text style={styles.routeText}>
                                    🎯 {match.dropoff_address}
                                </Text>
                                
                                <Text style={styles.infoText}>
                                    ⏰ {match.schedule_time} • {Array.isArray(match.schedule_days) ? match.schedule_days.join(', ') : match.schedule_days}
                                </Text>
                                
                                <Text style={styles.infoText}>
                                    💰 ${parseFloat(match.price || 0).toFixed(2)} • 🪑 {match.available_seats || 1} seat{match.available_seats > 1 ? 's' : ''}
                                </Text>
                                
                                <Text style={styles.searchInfoText}>
                                    Matches your search: {match.search_pickup} → {match.search_dropoff}
                                </Text>
                                
                                <View style={styles.actionsContainer}>
                                    <Button
                                        title="Request Ride"
                                        onPress={() => handleRequestRide(match.ride_id, match.match_id)}
                                        style={styles.requestButton}
                                    />
                                    <Button
                                        title="Dismiss"
                                        onPress={() => handleDismissMatch(match.match_id)}
                                        variant="outline"
                                        style={styles.dismissButton}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default NewMatchesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyCard: {
        padding: 24,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    matchCard: {
        marginBottom: 16,
    },
    matchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    driverName: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
    },
    rating: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    matchScoreContainer: {
        alignItems: "flex-end",
    },
    matchScoreLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    matchScore: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.secondary,
    },
    routeText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    searchInfoText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: "italic",
        marginTop: 8,
        marginBottom: 12,
    },
    actionsContainer: {
        flexDirection: "row",
        marginTop: 16,
        gap: 8,
    },
    requestButton: {
        flex: 2,
    },
    dismissButton: {
        flex: 1,
    },
});

