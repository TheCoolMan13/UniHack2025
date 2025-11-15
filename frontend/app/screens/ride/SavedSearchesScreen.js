import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { riderSearchesAPI } from "../../../services/api";

/**
 * Saved Searches Screen
 * Displays user's saved searches for future matches
 */
const SavedSearchesScreen = () => {
    const navigation = useNavigation();
    const [savedSearches, setSavedSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newMatchesCount, setNewMatchesCount] = useState(0);

    useEffect(() => {
        fetchSavedSearches();
    }, []);

    const fetchSavedSearches = async () => {
        try {
            setLoading(true);
            const response = await riderSearchesAPI.getMySavedSearches();
            if (response.data.success) {
                const searches = response.data.data.searches || [];
                setSavedSearches(searches);
                
                // Calculate total new matches
                const totalNewMatches = searches.reduce((sum, search) => sum + (search.new_matches || 0), 0);
                setNewMatchesCount(totalNewMatches);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load saved searches");
            }
        } catch (error) {
            console.error("Fetch saved searches error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to load saved searches";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSavedSearches();
    };

    const handleCancelSearch = async (searchId) => {
        Alert.alert(
            "Cancel Search",
            "Are you sure you want to cancel this saved search?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await riderSearchesAPI.cancelSavedSearch(searchId);
                            if (response.data.success) {
                                Alert.alert("Success", "Search cancelled");
                                fetchSavedSearches();
                            } else {
                                Alert.alert("Error", response.data.message || "Failed to cancel search");
                            }
                        } catch (error) {
                            console.error("Cancel search error:", error);
                            const errorMessage = error.response?.data?.message || error.message || "Failed to cancel search";
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            active: Colors.secondary,
            fulfilled: Colors.primary,
            cancelled: Colors.error
        };
        const statusLabels = {
            active: "Active",
            fulfilled: "Fulfilled",
            cancelled: "Cancelled"
        };
        return (
            <View style={[styles.statusBadge, { backgroundColor: statusColors[status] || Colors.textSecondary }]}>
                <Text style={styles.statusBadgeText}>{statusLabels[status] || status}</Text>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <Header title="Saved Searches" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Saved Searches" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* New Matches Banner */}
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

                {savedSearches.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No saved searches</Text>
                        <Text style={styles.emptySubtext}>
                            When you search for rides and find no matches, you can save your search to be notified when a matching ride becomes available.
                        </Text>
                    </Card>
                ) : (
                    savedSearches.map((search) => (
                        <Card key={search.id} style={styles.searchCard}>
                            <View style={styles.searchHeader}>
                                <Text style={styles.searchTitle}>Saved Search</Text>
                                {getStatusBadge(search.status)}
                            </View>
                            
                            <Text style={styles.routeText}>
                                📍 {search.pickup_address}
                            </Text>
                            <Text style={styles.routeText}>
                                🎯 {search.dropoff_address}
                            </Text>
                            
                            <Text style={styles.infoText}>
                                ⏰ {search.schedule_time} • {Array.isArray(search.schedule_days) ? search.schedule_days.join(', ') : search.schedule_days}
                            </Text>
                            
                            {search.new_matches > 0 && (
                                <View style={styles.matchesBadge}>
                                    <Text style={styles.matchesBadgeText}>
                                        {search.new_matches} new match{search.new_matches > 1 ? 'es' : ''}
                                    </Text>
                                </View>
                            )}
                            
                            {search.status === 'active' && (
                                <View style={styles.actionsContainer}>
                                    {search.new_matches > 0 && (
                                        <TouchableOpacity
                                            style={styles.actionButtonPrimary}
                                            onPress={() => navigation.navigate("NewMatches")}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="notifications" size={18} color={Colors.textLight} />
                                            <Text style={styles.actionButtonPrimaryText}>View Matches</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={styles.actionIconButton}
                                            onPress={() => {
                                                navigation.navigate("SearchRide", {
                                                    pickupLocation: search.pickup_address,
                                                    dropoffLocation: search.dropoff_address,
                                                    pickupCoordinates: {
                                                        latitude: parseFloat(search.pickup_latitude),
                                                        longitude: parseFloat(search.pickup_longitude),
                                                    },
                                                    dropoffCoordinates: {
                                                        latitude: parseFloat(search.dropoff_latitude),
                                                        longitude: parseFloat(search.dropoff_longitude),
                                                    },
                                                    time: search.schedule_time,
                                                    days: Array.isArray(search.schedule_days) ? search.schedule_days : [],
                                                });
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="search" size={20} color={Colors.primary} />
                                            <Text style={styles.actionIconButtonText}>Re-Search</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            style={styles.actionIconButton}
                                            onPress={() => {
                                                navigation.navigate("SearchRide", {
                                                    editingSearchId: search.id,
                                                    pickupLocation: search.pickup_address,
                                                    dropoffLocation: search.dropoff_address,
                                                    pickupCoordinates: {
                                                        latitude: parseFloat(search.pickup_latitude),
                                                        longitude: parseFloat(search.pickup_longitude),
                                                    },
                                                    dropoffCoordinates: {
                                                        latitude: parseFloat(search.dropoff_latitude),
                                                        longitude: parseFloat(search.dropoff_longitude),
                                                    },
                                                    time: search.schedule_time,
                                                    days: Array.isArray(search.schedule_days) ? search.schedule_days : [],
                                                });
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="create-outline" size={20} color={Colors.primary} />
                                            <Text style={styles.actionIconButtonText}>Edit</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            style={[styles.actionIconButton, styles.actionIconButtonDanger]}
                                            onPress={() => handleCancelSearch(search.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                            <Text style={[styles.actionIconButtonText, styles.actionIconButtonTextDanger]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default SavedSearchesScreen;

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
    searchCard: {
        marginBottom: 16,
    },
    searchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
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
    matchesBadge: {
        backgroundColor: Colors.secondary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    matchesBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.secondary,
    },
    actionsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    actionButtonPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    actionButtonPrimaryText: {
        color: Colors.textLight,
        fontSize: 15,
        fontWeight: "600",
    },
    actionButtonsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    actionIconButton: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.background,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 6,
    },
    actionIconButtonDanger: {
        backgroundColor: Colors.error + '08',
        borderColor: Colors.error + '30',
    },
    actionIconButtonText: {
        color: Colors.textPrimary,
        fontSize: 13,
        fontWeight: "500",
        marginTop: 2,
    },
    actionIconButtonTextDanger: {
        color: Colors.error,
    },
});

