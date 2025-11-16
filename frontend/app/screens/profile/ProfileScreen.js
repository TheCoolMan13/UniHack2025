import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { getProfilePictureUrl } from "../../../utils/profilePicture";

/**
 * Profile Screen
 * User profile management and settings
 */

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [imageError, setImageError] = React.useState(false);

    // Reset image error when user changes
    React.useEffect(() => {
        setImageError(false);
    }, [user?.id]);

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
                    {user?.id && !imageError ? (
                        <Image 
                            source={{ uri: user.avatar_url || getProfilePictureUrl(user.id) }} 
                            style={styles.avatarImage}
                            onError={() => {
                                // If image fails to load, show fallback
                                setImageError(true);
                            }}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.name}>{user?.name || "User"}</Text>
                {user?.email ? (
                    <Text style={styles.email}>{user.email}</Text>
                ) : null}
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>⭐ {user?.rating || 0}</Text>
                    {user?.verified ? (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified</Text>
                        </View>
                    ) : null}
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
                
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => navigation.navigate("EditProfile")}
                >
                    <Text style={styles.settingText}>Edit Profile</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => Alert.alert("Coming Soon", "Payment methods feature will be available soon.")}
                >
                    <Text style={styles.settingText}>Payment Methods</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => Alert.alert("Coming Soon", "Notifications settings will be available soon.")}
                >
                    <Text style={styles.settingText}>Notifications</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => Alert.alert("Help & Support", "For support, please contact us at support@carshare.com")}
                >
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
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    profileCard: {
        alignItems: "center",
        marginTop: 0,
        marginBottom: 16,
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
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.border,
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
        justifyContent: "center",
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
        marginLeft: 12,
    },
    verifiedText: {
        fontSize: 12,
        color: Colors.secondary,
        fontWeight: "600",
    },
    infoCard: {
        marginTop: 0,
        marginBottom: 16,
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
        marginTop: 0,
        marginBottom: 16,
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
        marginTop: 0,
        marginBottom: 16,
        borderColor: Colors.error,
    },
});

