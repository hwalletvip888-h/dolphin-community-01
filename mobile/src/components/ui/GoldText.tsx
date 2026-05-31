import React from "react";
import { Text } from "react-native";
import type { TextProps } from "react-native";

interface GoldTextProps extends TextProps {
  children: React.ReactNode;
}
// Simple gold-colored text (full gradient text requires react-native-masked-view)
export function GoldText({ children, style, ...props }: GoldTextProps) {
  return (
    <Text style={[{ color: "#F7D56D" }, style]} {...props}>
      {children}
    </Text>
  );
}
