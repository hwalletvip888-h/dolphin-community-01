import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

interface GoldButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export function GoldButton({ onPress, label, disabled, loading }: GoldButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      className="w-full h-[58px] rounded-[22px] overflow-hidden"
      style={{
        shadowColor: "rgba(247,198,95,0.4)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={["#FFF0A8", "#F7C65F", "#C97E22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center flex-row"
      >
        <Text className="text-[#1A0633] text-[18px] font-bold tracking-wide mr-2">
          {loading ? "处理中..." : label}
        </Text>
        {!loading && <ArrowRight size={20} color="#1A0633" strokeWidth={3} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}
