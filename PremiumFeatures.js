import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export function Paywall({ setIsPremium, setShowPaywall, onWatchAd }) {
  return (
    <ScrollView contentContainerStyle={styles.centerScroll} style={styles.paywall}>
      <Text style={styles.paywallTitle}>⚡ ADVANCED QR PRO 👑</Text>
      <Text style={styles.paywallSub}>Sblocca il pieno potenziale commerciale e grafico della tua applicazione</Text>
      
      <View style={styles.featuresBox}>
        {[
          '🎨 Cambia colori e aggiungi Loghi Centrali', 
          '🔗 Crea QR Dinamici permanenti (Senza Scadenza)', 
          '📁 Archivio dati illimitato con suddivisione Categorie', 
          '💾 Scarica ed esporta i file direttamente in Galleria (PNG)'
        ].map((f, i) => (
          <View key={i} style={styles.featRow}>
            <Text style={styles.feat}>{f}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity style={styles.adBtn} onPress={onWatchAd}>
        <Text style={styles.adBtnT}>📺 Sblocca funzioni Pro per questa sessione (Vedi Video)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.pBtn} onPress={() => { setIsPremium(true); setShowPaywall(false); }}>
        <Text style={styles.pBtnT}>Mensile — 1,99 € / mese (3gg gratis)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.pBtn} onPress={() => { setIsPremium(true); setShowPaywall(false); }}>
        <Text style={styles.pBtnT}>Annuale — 14,99 € / anno</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.pBtn} onPress={() => { setIsPremium(true); setShowPaywall(false); }}>
        <Text style={styles.pBtnT}>Sblocco a Vita — 24,99 €</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPaywall(false)}>
        <Text style={styles.closeTxt}>Continua con la versione limitata</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  paywall: { flex: 1, backgroundColor: '#0B0F19', paddingHorizontal: 20 },
  centerScroll: { justifyContent: 'center', paddingVertical: 40 },
  paywallTitle: { fontSize: 26, fontWeight: '900', color: '#D4AF37', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  paywallSub: { fontSize: 14, color: '#A0AEC0', textAlign: 'center', marginBottom: 25, lineHeight: 20, paddingHorizontal: 10 },
  featuresBox: { backgroundColor: '#161B26', padding: 20, borderRadius: 18, marginBottom: 25, borderWidth: 1, borderColor: '#2D3748' },
  featRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#20293A' },
  feat: { fontSize: 14, color: '#E2E8F0', fontWeight: '600' },
  pBtn: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 14, marginBottom: 12, alignItems: 'center' },
  pBtnT: { fontSize: 15, fontWeight: '700', color: '#0B0F19' },
  adBtn: { backgroundColor: '#161B26', padding: 16, borderRadius: 14, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#00ADB5' },
  adBtnT: { fontSize: 14, fontWeight: '700', color: '#00ADB5' },
  closeBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center' },
  closeTxt: { color: '#718096', textDecorationLine: 'underline', fontWeight: '600' }
});
