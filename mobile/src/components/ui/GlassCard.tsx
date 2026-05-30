import React from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export function GlassCard({ children, style, ...props }: GlassCardProps) {
  return (
    <View
      className="relative border border-hw-purple2/40 rounded-[32px] overflow-hidden"
      style={[
        {
          backgroundColor: "rgba(35,10,62,0.82)",
          shadowColor: "#C063FF",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.22,
          shadowRadius: 34,
          elevation: 20,
        },
        style,
      ]}
      {...props}
    >
      <View
        className="absolute top-0 left-[20%] right-[20%] h-[2px]"
        style={{
          backgroundColor: "#F7D56D",
          opacity: 0.6,
        }}
      />
      <View
        className="absolute top-0 left-0 w-full h-[30px]"
        style={{
          backgroundColor: "rgba(192,99,255,0.1)",
        }}
      />
      {children}
    </View>
  );
}
