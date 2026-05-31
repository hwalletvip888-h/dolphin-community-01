// Network resilience — exponential backoff retry + skeleton components
import { View } from "react-native";

// ── Retry wrapper ───────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

// ── Skeleton placeholder ────────────────────────────────

export function SkeletonBlock({ width, height }: { width?: number; height?: number }) {
  return (
    <View className="bg-white/10 rounded-xl" style={{ width, height: height || 16 }} />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-2">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-10 h-10 rounded-full bg-white/10" />
        <View className="flex-1">
          <View className="h-4 bg-white/10 rounded w-24 mb-1" />
          <View className="h-3 bg-white/10 rounded w-16" />
        </View>
        <View className="h-4 bg-white/10 rounded w-20" />
      </View>
    </View>
  );
}
