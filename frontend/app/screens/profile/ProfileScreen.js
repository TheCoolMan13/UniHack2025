import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";

/**
 * Profile Screen
 * User profile management and settings
 */

const ProfileScreen = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: () => logout(),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Profile" showBack={false} showStatusBar={true} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Profile Header */}
            <Card style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </View>
                </View>
                <Text style={styles.name}>{user?.name || "User"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>⭐ {user?.rating || 0}</Text>
                    {user?.verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                        </View>
                    )}
                </View>
            </Card>

            {/* Profile Info */}
            <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{user?.phone || "Not set"}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={styles.infoValue}>
                        {user?.role === "both" ? "Driver & Passenger" : user?.role || "Passenger"}
                    </Text>
                </View>
            </Card>

            {/* Settings */}
            <Card style={styles.settingsCard}>
                <Text style={styles.sectionTitle}>Settings</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Edit Profile</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Payment Methods</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Notifications</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Help & Support</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
            </Card>

            {/* Logout Button */}
            <Button
                title="Logout"
                variant="outline"
                onPress={handleLogout}
                style={styles.logoutButton}
            />
            </ScrollView>
        </View>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    profileCard: {
        alignItems: "center",
        margin: 16,
        marginTop: 0,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "bold",
        color: Colors.textLight,
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rating: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    verifiedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.secondary + "20",
    },
    verifiedText: {
        fontSize: 12,
        color: Colors.secondary,
        fontWeight: "600",
    },
    infoCard: {
        margin: 16,
        marginTop: 0,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    settingsCard: {
        margin: 16,
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    settingText: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    settingArrow: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    logoutButton: {
        margin: 16,
        marginTop: 0,
        borderColor: Colors.error,
    },
});

