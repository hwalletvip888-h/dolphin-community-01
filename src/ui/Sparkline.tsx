import { View, StyleSheet } from "react-native";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  negativeColor?: string;
}

export function Sparkline({ data, width = 80, height = 30, color = "#34D399", negativeColor = "#FB923C" }: Props) {
  if (!data.length) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? color : negativeColor;

  return (
    <View style={{ width, height }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 1 }}>
        {data.map((v, i) => {
          const h = ((v - min) / range) * height;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(2, h),
                backgroundColor: strokeColor,
                borderRadius: 1,
                opacity: 0.9,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
