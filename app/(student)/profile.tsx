import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { profileDb } from '../../database/profile';
import { StudentProfile } from '../../types';

const FILIERES = ['Informatique', 'Mathématiques', 'Physique', 'Économie', 'Droit', 'Médecine', 'Autre'];
const ANNEES = ['1', '2', '3', '4', '5'] as const;
const INTEREST_SUGGESTIONS = [
  'IA', 'Data Science', 'Web', 'Mobile', 'Cybersécurité',
  'Entrepreneuriat', 'Design', 'Recherche', 'Stage', 'Réseaux',
  'Blockchain', 'Cloud', 'DevOps', 'Marketing', 'Finance',
];

export default function Profile() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [filiere, setFiliere] = useState('Informatique');
  const [annee, setAnnee] = useState<'1'|'2'|'3'|'4'|'5'>('1');
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    const profile = profileDb.get(user.email);
    if (profile) {
      setDisplayName(profile.displayName);
      setFiliere(profile.filiere);
      setAnnee(profile.annee);
      setInterests(profile.interests);
    }
  }, [user]));

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests(prev => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleSave = () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Erreur', 'Le prénom/nom est obligatoire.');
      return;
    }
    profileDb.upsert({
      userId: user.email,
      displayName: displayName.trim(),
      filiere,
      annee,
      interests,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {displayName ? displayName[0].toUpperCase() : '👤'}
          </Text>
        </View>
        <Text style={styles.headerEmail}>{user?.email}</Text>
      </View>

      {/* Nom */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <Text style={styles.label}>Prénom & Nom</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ex: Fatima Zahra"
          placeholderTextColor="#bbb"
        />

        {/* Filière */}
        <Text style={styles.label}>Filière</Text>
        <View style={styles.chipRow}>
          {FILIERES.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filiere === f && styles.chipActive]}
              onPress={() => setFiliere(f)}
            >
              <Text style={[styles.chipText, filiere === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Année */}
        <Text style={styles.label}>Année études</Text>
        <View style={styles.anneeRow}>
          {ANNEES.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.anneeChip, annee === a && styles.anneeChipActive]}
              onPress={() => setAnnee(a)}
            >
              <Text style={[styles.anneeText, annee === a && styles.anneeTextActive]}>
                {a}ère{a === '1' ? '' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Centres d'intérêt */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Centres intérêt</Text>
        <Text style={styles.sectionDesc}>
          Sélectionne tes centres intérêt pour améliorer les recommandations IA
        </Text>
        <View style={styles.chipRow}>
          {INTEREST_SUGGESTIONS.map(interest => (
            <TouchableOpacity
              key={interest}
              style={[styles.interestChip, interests.includes(interest) && styles.interestChipActive]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[styles.interestText, interests.includes(interest) && styles.interestTextActive]}>
                {interests.includes(interest) ? '✓ ' : ''}{interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customInterestRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={customInterest}
            onChangeText={setCustomInterest}
            placeholder="Ajouter un intérêt..."
            placeholderTextColor="#bbb"
            onSubmitEditing={addCustomInterest}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustomInterest}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {interests.length > 0 && (
          <View style={styles.selectedInterests}>
            <Text style={styles.selectedLabel}>Sélectionnés ({interests.length}) :</Text>
            <View style={styles.chipRow}>
              {interests.map(i => (
                <TouchableOpacity
                  key={i}
                  style={styles.selectedChip}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={styles.selectedChipText}>{i} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Sauvegarder */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {saved ? '✅ Profil sauvegardé !' : '💾 Sauvegarder le profil'}
        </Text>
      </TouchableOpacity>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  header: {
    backgroundColor: '#6C63FF', padding: 32,
    alignItems: 'center', paddingBottom: 40,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: '700' },
  headerEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  section: {
    backgroundColor: '#fff', margin: 12, borderRadius: 20,
    padding: 20, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
sectionTitle: {
  fontSize: 16,
  fontWeight: '800',
  color: '#333',
  marginTop: 4,
  borderBottomWidth: 1,
  borderBottomColor: '#F0EEFF',
  paddingBottom: 10,
  marginBottom: 14,
},
  sectionDesc: { fontSize: 13, color: '#888', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#F8F8FF', borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#333', marginBottom: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1.5, borderColor: '#DDD', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText: { color: '#666', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  anneeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  anneeChip: {
    flex: 1, borderWidth: 1.5, borderColor: '#DDD', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  anneeChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  anneeText: { fontSize: 14, color: '#666', fontWeight: '600' },
  anneeTextActive: { color: '#fff' },
  interestChip: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F8F8FF',
  },
  interestChipActive: { backgroundColor: '#F0EEFF', borderColor: '#6C63FF' },
  interestText: { fontSize: 13, color: '#888' },
  interestTextActive: { color: '#6C63FF', fontWeight: '600' },
  customInterestRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  addBtn: {
    backgroundColor: '#6C63FF', width: 48, height: 48,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  selectedInterests: {
    backgroundColor: '#F8F8FF', borderRadius: 12, padding: 12,
  },
  selectedLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 8 },
  selectedChip: {
    backgroundColor: '#6C63FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  selectedChipText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    margin: 12, padding: 18, alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: '#2E7D32' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 14,
    marginHorizontal: 12, marginBottom: 12, padding: 16, alignItems: 'center',
  },
  logoutBtnText: { color: '#E53935', fontSize: 15, fontWeight: '600' },
});