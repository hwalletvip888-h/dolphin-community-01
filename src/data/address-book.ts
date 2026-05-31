// 鲸鱼地址簿 — 社区维护的已知地址标签
// 添加格式: { address: "0x...", tag: "smart_money"|"kol"|"sniper"|"scammer", note: "备注", addedAt: "日期" }

export interface AddressEntry {
  address: string;
  tag: "smart_money" | "kol" | "sniper" | "scammer";
  note: string;
  addedAt: string;
}

export const KNOWN_ADDRESSES: AddressEntry[] = [
  // ── 聪明钱 (已验证盈利地址) ──
  // { address: "0x...", tag: "smart_money", note: "BTC 波段高手, 胜率 68%", addedAt: "2026-06-01" },

  // ── KOL / 知名交易者 ──
  // { address: "0x...", tag: "kol", note: "Twitter 50K 粉丝", addedAt: "2026-06-01" },

  // ── 狙击手 / 机器人 ──
  // { address: "0x...", tag: "sniper", note: "高频小额交易, 疑似 MEV 机器人", addedAt: "2026-06-01" },

  // ── 诈骗地址 ──
  // { address: "0x...", tag: "scammer", note: "假空投钓鱼地址", addedAt: "2026-06-01" },
];

// 签名模式检测 (不需要完整地址)
export const SNIPER_SIGNATURES = [
  /snipe/i, /bot/i, /mev/i, /frontrun/i, /sandwich/i,
];

export const SCAM_KEYWORDS = [
  "phishing", "scam", "fake", "hack", "exploit",
];

export function matchAddress(addr: string): AddressEntry | null {
  const lower = addr.toLowerCase();
  return KNOWN_ADDRESSES.find(a => a.address.toLowerCase() === lower) || null;
}

export function addAddress(entry: AddressEntry): void {
  if (!KNOWN_ADDRESSES.find(a => a.address.toLowerCase() === entry.address.toLowerCase())) {
    KNOWN_ADDRESSES.push(entry);
  }
}
