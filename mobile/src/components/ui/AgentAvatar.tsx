import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

interface AgentAvatarProps {
  source: string;
  size?: number;
  ringColor?: string;
  glowColor?: string;
}

// Agent avatar images bundled with the app
const agentImages: Record<string, any> = {
  "agent-worldcup": require("../../../assets/agents/agent-worldcup.jpg"),
  "agent-dolphin": require("../../../assets/agents/agent-dolphin.jpg"),
  "agent-onchain": require("../../../assets/agents/agent-onchain.jpg"),
  "agent-zhuge": require("../../../assets/agents/agent-zhuge.jpg"),
  "agent-wealth": require("../../../assets/agents/agent-wealth.jpg"),
  "agent-reward": require("../../../assets/agents/agent-reward.jpg"),
};

const defaultRequire = require("../../../assets/agents/agent-dolphin.jpg");

export function AgentAvatar({ source, size = 60, ringColor = "#8A3FFC", glowColor }: AgentAvatarProps) {
  const imgSource = agentImages[source] || defaultRequire;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: 2,
        backgroundColor: ringColor,
        shadowColor: glowColor || ringColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowColor ? 0.5 : 0.3,
        shadowRadius: size / 2,
        elevation: 8,
      }}
    >
      <Image
        source={imgSource}
        style={{ width: "100%", height: "100%", borderRadius: size / 2 }}
        contentFit="cover"
      />
    </View>
  );
}
