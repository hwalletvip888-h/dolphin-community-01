import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Trash2, Bookmark, MessageSquare } from "lucide-react-native";
import { useBookmarks, type Bookmark } from "@/src/stores/bookmarks";

export default function BookmarksScreen() {
  const router = useRouter();
  const { items, remove } = useBookmarks();

  const handleDelete = (item: Bookmark) => {
    Alert.alert("删除收藏", "确定要删除这条收藏吗？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => remove(item.id) },
    ]);
  };

  const handleJump = (item: Bookmark) => {
    router.push(`/chat/${item.agentId}`);
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity style={s.card} onPress={() => handleJump(item)} activeOpacity={0.7}>
      <View style={s.cardHeader}>
        <View style={s.agentBadge}>
          <Text style={s.agentName}>{item.agentName}</Text>
        </View>
        {item.cardType && (
          <View style={s.typeBadge}>
            <Text style={s.typeText}>{item.cardType}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={s.date}>
          {new Date(item.savedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
        </Text>
      </View>
      <Text style={s.content} numberOfLines={4}>{item.content}</Text>
      <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
        <Trash2 size={14} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={23} color="#fff" />
        </TouchableOpacity>
        <Bookmark size={18} color="#F7D56D" />
        <Text style={s.headerTitle}>我的收藏</Text>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Bookmark size={48} color="rgba(255,255,255,0.1)" />
          <Text style={s.emptyTitle}>暂无收藏</Text>
          <Text style={s.emptyDesc}>在对话中点击星标按钮收藏重要回复</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 16,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.12)",
    padding: 14, position: "relative",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  agentBadge: { backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  agentName: { fontSize: 11, fontWeight: "600", color: "#F7D56D" },
  typeBadge: { backgroundColor: "rgba(192,99,255,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: "600", color: "#C063FF" },
  date: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  content: { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 20 },
  deleteBtn: { position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.3)" },
  emptyDesc: { fontSize: 13, color: "rgba(255,255,255,0.2)" },
});
