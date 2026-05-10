import * as Device from "expo-device";
import { Platform } from "react-native";

// Vérifie qu'on est sur un vrai appareil (pas simulateur)
const isRealDevice = (): boolean => Device.isDevice === true;

// Import dynamique pour éviter le crash au chargement dans Expo Go
async function N() {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isRealDevice()) return false;
  const Notif = await N();
  if (!Notif) return false;

  try {
    const { status: existing } = await Notif.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notif.requestPermissionsAsync();
    if (status !== "granted") return false;

    if (Platform.OS === "android") {
      await Notif.setNotificationChannelAsync("campus-events", {
        name: "Événements Campus",
        importance: Notif.AndroidImportance.HIGH,
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function scheduleEventReminder(
  eventId: string,
  eventTitle: string,
  eventDate: Date,
  hoursBeforeList: number[] = [24, 1],
): Promise<string[]> {
  if (!isRealDevice()) return [];

  const granted = await requestNotificationPermission();
  if (!granted) return [];

  const Notif = await N();
  if (!Notif) return [];

  const ids: string[] = [];

  for (const h of hoursBeforeList) {
    const triggerDate = new Date(eventDate.getTime() - h * 3600 * 1000);
    if (triggerDate <= new Date()) continue;

    try {
      const id = await Notif.scheduleNotificationAsync({
        content: {
          title: h === 1 ? "Dans 1 heure !" : `Rappel dans ${h}h`,
          body: eventTitle,
          data: { eventId },
        },
        trigger: {
          type: Notif.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      ids.push(id);
    } catch {
      // ignore les erreurs individuelles
    }
  }

  return ids;
}

export async function cancelEventReminders(notifIds: string[]): Promise<void> {
  if (!isRealDevice()) return;
  const Notif = await N();
  if (!Notif) return;

  for (const id of notifIds) {
    try {
      await Notif.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
}
