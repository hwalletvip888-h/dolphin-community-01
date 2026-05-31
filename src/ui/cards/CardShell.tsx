import { View, StyleSheet } from "react-native";
import type { ReactNode } from "react";

export function CardShell({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 14, overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(192,99,255,0.18)",
    backgroundColor: "rgba(15,5,45,0.88)",
  },
});
