import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/src/stores/auth";

export default function RootLayout() {
  const { boot } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    boot().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: "#090012", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#F7D56D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="wallet" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="bookmarks" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="chat/[agentId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="discover/worldcup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="discover/strategies" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="discover/onchain" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="discover/events" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="discover/leaderboard" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
