import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/stores/auth";

export default function Index() {
  const { loggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loggedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [loggedIn]);

  return <View style={{ flex: 1, backgroundColor: "#090012" }} />;
}
