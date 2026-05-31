import "../src/global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import { useAuthStore } from "@/src/stores";

async function initDbIfNative() {
  if (Platform.OS !== "web") {
    const { initDb } = await import("@/src/lib/db");
    initDb();
  }
}

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);

  useEffect(() => {
    loadStoredAuth();
    initDbIfNative();
    // Register push notifications (fire & forget)
    import("@/src/lib/notifications").then((m) => {
      m.registerForPushNotifications().then((token) => {
        if (token) console.log("[push] token:", token);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
