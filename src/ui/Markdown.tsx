import { Text, StyleSheet } from "react-native";

function parse(text: string): { parts: Array<{ type: "text" | "bold"; text: string }> } {
  // Safe split: only handle **bold**, everything else is plain text
  const parts: Array<{ type: "text" | "bold"; text: string }> = [];
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  for (const seg of segments) {
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
      parts.push({ type: "bold", text: seg.slice(2, -2) });
    } else if (seg) {
      parts.push({ type: "text", text: seg });
    }
  }

  return { parts };
}

function SafeText({ text }: { text: string }) {
  return <Text style={s.text}>{text}</Text>;
}

export function Markdown({ text }: { text: string }) {
  if (!text) return null;

  try {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<Text key={`br-${i}`}>{"\n"}</Text>);
      continue;
    }

    const { parts } = parse(line);
    elements.push(
      <Text key={i}>
        {parts.map((p, j) =>
          p.type === "bold" ? (
            <Text key={j} style={s.bold}>{p.text}</Text>
          ) : (
            <Text key={j} style={s.text}>{p.text}</Text>
          )
        )}
        {i < lines.length - 1 ? "\n" : ""}
      </Text>
    );
  }

  return <Text>{elements}</Text>;
  } catch {
    return <SafeText text={text} />;
  }
}

const s = StyleSheet.create({
  text: { fontSize: 15, color: "rgba(255,255,255,0.88)", lineHeight: 23 },
  bold: { fontWeight: "700", color: "#fff" },
});
