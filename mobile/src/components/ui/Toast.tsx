import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { X } from "lucide-react-native";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onDismiss: () => void;
}

export function Toast({ message, type = "info", visible, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!message) return null;

  const bgColor =
    type === "success" ? "rgba(52,211,153,0.2)" : type === "error" ? "rgba(255,109,114,0.2)" : "rgba(138,63,252,0.2)";
  const borderColor =
    type === "success" ? "rgba(52,211,153,0.4)" : type === "error" ? "rgba(255,109,114,0.4)" : "rgba(138,63,252,0.4)";
  const textColor = type === "success" ? "#55F59A" : type === "error" ? "#FF6D72" : "#C063FF";

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 48,
        left: 16,
        right: 16,
        zIndex: 50,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        transform: [{ translateY }],
        opacity: opacityAnim,
      }}
    >
      <Text style={{ flex: 1, fontSize: 13, color: textColor }}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <X size={16} color={textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}
