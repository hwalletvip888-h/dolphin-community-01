import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";

export function HIcon({ size, active }: { size: number; active: boolean }) {
  const s = size;
  const w = s * 0.52;   // total width of H
  const h = s * 0.62;   // total height of H
  const strokeW = s * 0.12; // bar thickness
  const crossH = h * 0.44;  // crossbar height

  const x = (s - w) / 2;
  const y = (s - h) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const crossY = y + (h - crossH) / 2;

  const gold = active ? "#F7D56D" : "rgba(235,216,255,0.5)";

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <LinearGradient id="hgold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF0A8" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#F7C65F" stopOpacity="1" />
          <Stop offset="1" stopColor="#C97E22" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* Left vertical bar */}
      <Rect x={x} y={y} width={strokeW} height={h} rx={strokeW / 2} fill={active ? "url(#hgold)" : gold} />
      {/* Right vertical bar */}
      <Rect x={x + w - strokeW} y={y} width={strokeW} height={h} rx={strokeW / 2} fill={active ? "url(#hgold)" : gold} />
      {/* Crossbar */}
      <Rect x={x} y={crossY} width={w} height={crossH} rx={crossH / 2} fill={active ? "url(#hgold)" : gold} />
    </Svg>
  );
}
