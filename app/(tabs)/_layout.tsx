import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Home, Users, Wallet } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0D0020", borderTopColor: "rgba(192,99,255,0.12)", borderTopWidth: 0.5, height: 84, paddingTop: 8, paddingBottom: 28 },
        tabBarActiveTintColor: "#F7D56D",
        tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "首页", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: "社区", tabBarIcon: ({ color, size }) => <Users size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "资产", tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} /> }} />
    </Tabs>
  );
}
