import { StyleSheet, Text, View } from "react-native";

export default function Registrations() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mes inscriptions — bientôt disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 16, color: "#888" },
});
