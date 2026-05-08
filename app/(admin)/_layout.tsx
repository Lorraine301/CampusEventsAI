import { Stack } from "expo-router";
import { LogOut } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1F1D3A" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "800", fontSize: 17 },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <LogOut size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index"    options={{ title: "Tableau de bord" }} />
      <Stack.Screen name="create"   options={{ title: "Créer un événement" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Modifier l'événement" }} />
    </Stack>
  );
}