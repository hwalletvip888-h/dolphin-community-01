import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification behavior (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // uses app.json slug
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "海豚社区通知",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

// ── Notification types ──────────────────────────────────

export type NotificationPayload = {
  type: "signal" | "agent_reply" | "transaction" | "activity";
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendLocalNotification(payload: NotificationPayload) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: "default",
    },
    trigger: null, // immediate
  });
}

// ── Notification listener hook setup ────────────────────

export type NotificationHandler = (payload: NotificationPayload) => void;

export function addNotificationListener(handler: NotificationHandler): () => void {
  // Foreground
  const foreSub = Notifications.addNotificationReceivedListener((n) => {
    const data = n.request.content.data as Record<string, string> | undefined;
    handler({
      type: (data?.type as NotificationPayload["type"]) || "activity",
      title: n.request.content.title || "",
      body: n.request.content.body || "",
      data,
    });
  });

  // Tap to open
  const tapSub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as Record<string, string> | undefined;
    handler({
      type: (data?.type as NotificationPayload["type"]) || "activity",
      title: resp.notification.request.content.title || "",
      body: resp.notification.request.content.body || "",
      data,
    });
  });

  return () => { foreSub.remove(); tapSub.remove(); };
}
