import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6C63FF",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          paddingBottom: 6,
          paddingTop: 4,
          height: 62,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#6C63FF",
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 16,
        },
        headerStyle: { backgroundColor: "#6C63FF" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: "Événements",
          tabBarLabel: "Événements",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📅</Text>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
          tabBarLabel: "Favoris",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>❤️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Inscriptions",
          tabBarLabel: "Inscriptions",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🎫</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant IA",
          tabBarLabel: "Assistant",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🤖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mon profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
