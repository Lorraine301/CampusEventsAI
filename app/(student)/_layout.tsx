import { Tabs } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function StudentLayout() {
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6C63FF",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { paddingBottom: 4 },
        headerStyle: { backgroundColor: "#6C63FF" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 14 }}>Déconnexion</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: "Événements",
          tabBarLabel: "Événements",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📅</Text>
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
            <Text style={{ fontSize: 20, color }}>❤️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Mes inscriptions",
          tabBarLabel: "Inscriptions",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🎫</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant IA",
          tabBarLabel: "Assistant",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🤖</Text>
          ),
        }}
      />
    </Tabs>
  );
}
