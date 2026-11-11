import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export const Paywall = ({ setIsPremium, setPremiumType, setShowPaywall, onWatchAd, filter = 'all' }) => {
  
  const handlePurchase = (planType) => {
    setPremiumType(planType);
    setIsPremium(true);
    setShowPaywall(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>👑 PASSA A ADVANCED QR PRO</Text>
        <Text style={styles.title}>Sblocca tutta la potenza dei QR Code</Text>
        <Text style={styles.subtitle}>Personalizza con colori, inserisci il tuo logo e gestisci i tuoi codici senza limiti.</Text>

        {(filter === 'all' || filter === 'subscriptions') && (
          <>
            <TouchableOpacity style={styles.card} onPress={() => handlePurchase('mensile')}>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>Piano Mensile</Text>
                <Text style={styles.price}>3,99 € / mese</Text>
              </View>
              <Text style={styles.desc}>• Fino a 20 QR Dinamici attivi al mese</Text>
              <Text style={styles.desc}>• Colori personalizzati e Logo centrale</Text>
              <Text style={styles.desc}>• Nessuna filigrana e zero pubblicità</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.cardGold]} onPress={() => handlePurchase('annuale')}>
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>PIÙ SCELTO • RISPARMI IL 48%</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>Piano Annuale</Text>
                <Text style={styles.priceGold}>24,99 € / anno</Text>
              </View>
              <Text style={styles.desc}>• QR Dinamici ILLIMITATI senza scadenza</Text>
              <Text style={styles.desc}>• Tutte le funzioni Pro incluse</Text>
            </TouchableOpacity>
          </>
        )}

        {(filter === 'all' || filter === 'lifetime') && (
          <TouchableOpacity style={[styles.card, styles.cardLifetime]} onPress={() => handlePurchase('vita')}>
            <View style={styles.promoTagCyan}>
              <Text style={styles.promoTagTextDark}>🔥 OFFERTA LANCIO 1° MESE (INVECE DI 49,99 €)</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.planName}>Accesso A Vita</Text>
              <Text style={styles.priceCyan}>24,99 €</Text>
            </View>
            <Text style={styles.desc}>• Paghi una volta sola, tuo per sempre</Text>
            <Text style={styles.desc}>• Sblocca anche i QR STATICI permanenti</Text>
            <Text style={styles.desc}>• QR Dinamici illimitati a vita</Text>
          </TouchableOpacity>
        )}

        {filter !== 'lifetime' && (
          <TouchableOpacity style={styles.adBtn} onPress={onWatchAd}>
            <Text style={styles.adBtnText}>📺 Guarda un video (1 azione gratis)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPaywall(false)}>
          <Text style={styles.closeBtnText}>Continua con la versione base</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D1A', paddingTop: 50 },
  scroll: { padding: 20, paddingBottom: 40 },
  badge: { color: '#D4AF37', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center', marginBottom: 8 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#637394', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  card: { backgroundColor: '#141929', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1F273D' },
  cardGold: { borderColor: '#D4AF37', borderWidth: 2 },
  cardLifetime: { borderColor: '#00ADB5', borderWidth: 2 },
  promoTag: { backgroundColor: '#D4AF37', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  promoTagText: { color: '#090D1A', fontSize: 10, fontWeight: '800' },
  promoTagCyan: { backgroundColor: '#00ADB5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  promoTagTextDark: { color: '#090D1A', fontSize: 10, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  price: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  priceGold: { color: '#D4AF37', fontSize: 18, fontWeight: '800' },
  priceCyan: { color: '#00ADB5', fontSize: 20, fontWeight: '800' },
  desc: { color: '#A0AEC0', fontSize: 13, marginBottom: 5 },
  adBtn: { backgroundColor: '#1F273D', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#2F3B5C' },
  adBtnText: { color: '#00ADB5', fontWeight: '700', fontSize: 14 },
  closeBtn: { padding: 16, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#637394', fontSize: 13, textDecorationLine: 'underline' }
});
