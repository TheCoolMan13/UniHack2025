import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

// Screens
import HomeScreen from "../screens/home/HomeScreen";
import MapScreen from "../screens/map/MapScreen";
import MyRidesScreen from "../screens/ride/MyRidesScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import PostRideScreen from "../screens/ride/PostRideScreen";
import SearchRideScreen from "../screens/ride/SearchRideScreen";
import DeliverPackageScreen from "../screens/ride/DeliverPackageScreen";
import LocationSelectionScreen from "../screens/map/LocationSelectionScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Home Stack Navigator
 * Contains HomeScreen and modal screens
 */
const HomeStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="HomeMain"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen
                name="PostRide"
                component={PostRideScreen}
                options={{
                    presentation: "modal",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="SearchRide"
                component={SearchRideScreen}
                options={{
                    presentation: "modal",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="DeliverPackage"
                component={DeliverPackageScreen}
                options={{
                    presentation: "modal",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="LocationSelection"
                component={LocationSelectionScreen}
                options={{
                    presentation: "modal",
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */
const MainNavigator = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            initialRouteName="Home"
            backBehavior="initialRoute"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "Home") {
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "Map") {
                        iconName = focused ? "map" : "map-outline";
                    } else if (route.name === "MyRides") {
                        iconName = focused ? "car" : "car-outline";
                    } else if (route.name === "Profile") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.backgroundLight,
                    borderTopColor: Colors.border,
                    paddingBottom: Math.max(insets.bottom, 5),
                    paddingTop: 5,
                    height: 60 + Math.max(insets.bottom, 0),
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="MyRides" component={MyRidesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainNavigator;

