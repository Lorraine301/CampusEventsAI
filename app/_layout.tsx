import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "react-native-get-random-values";
import { AuthProvider, useAuth } from "../context/AuthContext";

import { ActivityIndicator, View } from "react-native";
import { initDatabase } from "../database/init";

initDatabase();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    const inWelcome = segments[0] === "welcome";

    if (!user && !inAuth && !inWelcome) {
      router.replace("/welcome");
    } else if (user && (inAuth || inWelcome)) {
      if (user.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(student)/events");
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#5B52E8",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(student)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
