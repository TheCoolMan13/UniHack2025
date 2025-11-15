import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
                                        <Button
                                            title="View Matches"
                                            onPress={() => navigation.navigate("NewMatches")}
                                            style={styles.actionButton}
                                        />
                                    )}
                                    <Button
                                        title="Cancel Search"
                                        onPress={() => handleCancelSearch(search.id)}
                                        variant="outline"
                                        style={styles.actionButton}
                                    />
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
        flexDirection: "row",
        marginTop: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
    },
});

