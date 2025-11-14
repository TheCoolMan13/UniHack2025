import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import SearchBar from "../../../components/common/SearchBar";
import ServiceButton from "../../../components/common/ServiceButton";
import { Colors } from "../../../constants/colors";
import { useAuth } from "../../../context/AuthContext";

/**
 * Home Screen
 * Main dashboard with services and quick actions
 */
const HomeScreen = () => {
  console.log("HomeScreen is being called");
  const navigation = useNavigation();
  const { user, currentRole } = useAuth();
  const [currentRoleState] = useState(currentRole || 'passenger'); // 'driver' or 'passenger'
  const insets = useSafeAreaInsets();

  const handleSearchPress = () => {
    navigation.navigate("SearchRide");
  };

  const handleLaterPress = () => {
    // Navigate to schedule screen (future implementation)
    console.log('Later pressed');
  };

  const handleServicePress = (service) => {
    switch (service) {
      case 'Find Ride':
        navigation.navigate("SearchRide");
        break;
      case 'Become a rider':
      case 'Offer Ride':
        navigation.navigate("PostRide");
        break;
      case 'My Rides':
        navigation.navigate("MyRides");
        break;
      case 'Deliver a Package':
        navigation.navigate("DeliverPackage");
        break;
      case 'Profile':
        navigation.navigate("Profile");
        break;
      case 'Active Rides':
        navigation.navigate("MyRides");
        break;
      case 'History':
        navigation.navigate("MyRides");
        break;
      case 'Favorites':
        // Navigate to favorites (future implementation)
        console.log('Favorites pressed');
        break;
      default:
        console.log(`${service} pressed`);
        return;
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <View style={[styles.statusBarArea, { height: insets.top }]} />
      <SafeAreaView style={styles.container} edges={[]}>
        {/* Header with Logo */}
        <View style={styles.header}>
        <Text style={styles.logo}>NibbleForce</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => handleServicePress('Profile')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <SearchBar
          placeholder={currentRoleState === 'driver' ? 'Where are you going?' : 'Where to?'}
          onPress={handleSearchPress}
          rightButton={
            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleLaterPress}
              activeOpacity={0.7}
            >
              <Text style={styles.laterIcon}>📅</Text>
              <Text style={styles.laterText}>Later</Text>
            </TouchableOpacity>
          }
        />

        {/* Services Grid */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesGrid}>
            <ServiceButton
              icon="🔍"
              label="Find Ride"
              onPress={() => handleServicePress('Find Ride')}
              style={styles.serviceButton}
            />
            <ServiceButton
              icon="🚗"
              label="Become a rider"
              onPress={() => handleServicePress('Become a rider')}
              style={styles.serviceButton}
            />
            <ServiceButton
              icon="📋"
              label="My Rides"
              onPress={() => handleServicePress('My Rides')}
              style={styles.serviceButton}
            />
            <ServiceButton
              icon="📦"
              label="Deliver a Package"
              onPress={() => handleServicePress('Deliver a Package')}
              style={styles.serviceButton}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleServicePress('Active Rides')}
            >
              <Text style={styles.quickActionIcon}>⚡</Text>
              <Text style={styles.quickActionLabel}>Active Rides</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleServicePress('History')}
            >
              <Text style={styles.quickActionIcon}>📜</Text>
              <Text style={styles.quickActionLabel}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleServicePress('Favorites')}
            >
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={styles.quickActionLabel}>Favorites</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🚀</Text>
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>
              Start sharing rides to see your activity here
            </Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#000000",
  },
  statusBarArea: {
    backgroundColor: "#000000",
    height: 0, // Will be set dynamically
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  laterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  laterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  laterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary || Colors.text,
  },
  servicesSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary || Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceButton: {
    width: '47%',
  },
  quickActionsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary || Colors.text,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginTop: 16,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary || Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary || Colors.textLight,
    textAlign: 'center',
  },
});

