// Secure storage wrapper for JWT and user data
import * as SecureStore from "expo-secure-store";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("dolphin_token");
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("dolphin_token", token);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync("dolphin_token");
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync("dolphin_user_id");
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync("dolphin_user_id", id);
}
