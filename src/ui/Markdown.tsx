import { View, Text, StyleSheet } from "react-native";

export function Markdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inTable) { elements.push(renderTable(tableRows, `t${i}`)); tableRows = []; inTable = false; }
      elements.push(<View key={`br${i}`} style={md.br} />);
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").filter(c => c.trim()).map(c => c.trim());
      if (!inTable) { inTable = true; tableRows = [cells]; continue; }
      if (cells.every(c => /^:?-+:?$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    }

    if (trimmed.startsWith("### ")) { elements.push(<Text key={i} style={md.h3}>{bold(trimmed.slice(4))}</Text>); continue; }
    if (trimmed.startsWith("## ")) { elements.push(<Text key={i} style={md.h2}>{bold(trimmed.slice(3))}</Text>); continue; }
    if (trimmed.startsWith("# ")) { elements.push(<Text key={i} style={md.h1}>{bold(trimmed.slice(2))}</Text>); continue; }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(<Text key={i} style={md.li}><Text style={md.bullet}>  •  </Text>{bold(trimmed.slice(2))}</Text>);
      continue;
    }

    elements.push(<Text key={i} style={md.p}>{bold(trimmed)}</Text>);
  }

  if (inTable) elements.push(renderTable(tableRows, "tlast"));
  return <View>{elements}</View>;
}

function bold(t: string): React.ReactNode {
  const parts = t.split(/(\*\*[^*]+\*\*)/g);
  const nodes: React.ReactNode[] = [];
  parts.forEach((p, j) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) nodes.push(<Text key={j} style={md.b}>{p.slice(2, -2)}</Text>);
    else if (p) nodes.push(<Text key={j}>{p}</Text>);
  });
  return nodes.length === 1 ? nodes[0] : <Text>{nodes}</Text>;
}

function renderTable(rows: string[][], key: string) {
  if (!rows.length) return null;
  const cols = Math.max(...rows.map(r => r.length));
  return (
    <View key={key} style={md.tbl}>
      {rows.map((row, ri) => (
        <View key={ri} style={[md.tRow, ri > 0 && md.tRowSep]}>
          {Array.from({ length: cols }).map((_, ci) => (
            <View key={ci} style={{ flex: 1, padding: 7 }}>
              <Text style={ri === 0 ? md.tH : md.tD} numberOfLines={2}>{row[ci] || ""}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const md = StyleSheet.create({
  br: { height: 10 },
  h1: { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 8, lineHeight: 28 },
  h2: { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 6, lineHeight: 24, marginTop: 4 },
  h3: { fontSize: 15, fontWeight: "700", color: "#C063FF", marginBottom: 4, lineHeight: 22 },
  p: { fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 22, marginBottom: 2 },
  li: { fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 22, marginBottom: 1 },
  bullet: { color: "rgba(255,255,255,0.3)" },
  b: { fontWeight: "700", color: "#fff" },
  tbl: { borderRadius: 10, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginVertical: 8 },
  tRow: { flexDirection: "row" },
  tRowSep: { borderTopWidth: 0.5, borderColor: "rgba(255,255,255,0.06)" },
  tH: { fontSize: 12, fontWeight: "700", color: "#F7D56D" },
  tD: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
});
