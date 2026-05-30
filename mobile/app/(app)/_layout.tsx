import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { MessageSquare, Wallet, Activity, Settings } from "lucide-react-native";
import { HIcon } from "@/src/components/ui/HIcon";

function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerButton}>
      <View style={styles.centerInner}>
        <HIcon size={28} active={focused} />
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(26,6,51,0.95)",
          borderTopColor: "rgba(138,63,252,0.3)",
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 30,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#F7D56D",
        tabBarInactiveTintColor: "rgba(235,216,255,0.5)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
      <Tabs.Screen name="defi" options={{ href: null }} />
      <Tabs.Screen
        name="chat"
        options={{
          title: "对话",
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: "信号",
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "社区",
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 11, fontWeight: "700", color: focused ? "#F7D56D" : "rgba(235,216,255,0.5)", marginTop: -4 }}>
              社区
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "钱包",
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(20,4,40,0.95)",
    borderWidth: 2,
    borderColor: "rgba(247,213,109,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    shadowColor: "#F7D56D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  centerInner: {
    alignItems: "center",
    justifyContent: "center",
  },
});
