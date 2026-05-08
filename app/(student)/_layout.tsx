import { Tabs } from "expo-router";
import { Calendar, Heart, TicketCheck, Bot, UserCircle2 } from "lucide-react-native";

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5B52E8",
        tabBarInactiveTintColor: "#B0AED4",
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 6,
          height: 66,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#5B52E8",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: -6 },
          shadowRadius: 20,
          backgroundColor: "#fff",
        },
        headerStyle: { backgroundColor: "#5B52E8" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "800", fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: "Événements",
          tabBarLabel: "Événements",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={2} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
          tabBarLabel: "Favoris",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} strokeWidth={2} />,
          headerStyle: { backgroundColor: "#5B52E8" },
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Inscriptions",
          tabBarLabel: "Inscriptions",
          tabBarIcon: ({ color, size }) => <TicketCheck color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant IA",
          tabBarLabel: "Assistant",
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mon profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => <UserCircle2 color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}