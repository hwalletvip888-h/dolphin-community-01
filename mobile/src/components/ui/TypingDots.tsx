import React from "react";
import { View } from "react-native";

export function TypingDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C063FF", marginHorizontal: 3, opacity: 0.3 }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C063FF", marginHorizontal: 3, opacity: 0.6 }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C063FF", marginHorizontal: 3, opacity: 1 }} />
    </View>
  );
}
