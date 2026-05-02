import { Stack } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <Stack
      screenOptions={{
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
      <Stack.Screen
        name="index"
        options={{ title: "Gestion des événements" }}
      />
      <Stack.Screen name="create" options={{ title: "Créer un événement" }} />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: "Modifier l'événement" }}
      />
    </Stack>
  );
}
