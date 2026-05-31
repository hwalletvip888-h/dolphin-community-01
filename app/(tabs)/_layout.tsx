import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Home, Bot, Compass, User } from "lucide-react-native";

function CenterTab({ focused }: { focused: boolean }) {
  return (
    <View style={[cs.wrap, focused && cs.wrapActive]}>
      <Text style={[cs.letter, focused && cs.letterActive]}>H</Text>
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(192,99,255,0.15)", borderWidth: 1.5,
    borderColor: "rgba(192,99,255,0.25)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  wrapActive: {
    backgroundColor: "rgba(192,99,255,0.3)", borderColor: "#C063FF",
  },
  letter: { fontSize: 22, fontWeight: "900", color: "#C063FF" },
  letterActive: { color: "#F7D56D" },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0020",
          borderTopColor: "rgba(192,99,255,0.12)",
          borderTopWidth: 0.5,
          height: 84,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: "#F7D56D",
        tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "首页", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="agents" options={{ title: "Agent", tabBarIcon: ({ color, size }) => <Bot size={size} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: "", tabBarIcon: ({ focused }) => <CenterTab focused={focused} /> }} />
      <Tabs.Screen name="discover" options={{ title: "发现", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "我的", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
