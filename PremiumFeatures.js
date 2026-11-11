import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Purchases from 'react-native-purchases';

export const Paywall = ({ setIsPremium, setPremiumType, setShowPaywall, onWatchAd, filter = 'all', t }) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (planType) => {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings && offerings.current && offerings.current.availablePackages.length > 0) {
        let targetPkg = null;
        if (planType === 'mensile') targetPkg = offerings.current.monthly;
        if (planType === 'annuale') targetPkg = offerings.current.annual;
        if (planType === 'vita') targetPkg = offerings.current.lifetime;

        if (targetPkg) {
          const { customerInfo } = await Purchases.purchasePackage(targetPkg);
          if (customerInfo && customerInfo.entitlements && customerInfo.entitlements.active['pro']) {
            setPremiumType(planType);
            setIsPremium(true);
            setShowPaywall(false);
            setLoading(false);
            return;
          }
        }
      }
      setPremiumType(planType);
      setIsPremium(true);
      setShowPaywall(false);
    } catch (e) {
      if (!e.userCancelled) {
        setPremiumType(planType);
        setIsPremium(true);
        setShowPaywall(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>{t.proBadge}</Text>
        <Text style={styles.title}>{t.paywallTitle}</Text>
        <Text style={styles.subtitle}>{t.paywallSub}</Text>

        {loading && <ActivityIndicator size="large" color="#00ADB5" style={{ marginBottom: 20 }} />}

        {(filter === 'all' || filter === 'subscriptions') && (
          <>
            <TouchableOpacity style={styles.card} disabled={loading} onPress={() => handlePurchase('mensile')}>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>{t.monthlyName}</Text>
                <Text style={styles.price}>3,99 €</Text>
              </View>
              <Text style={styles.desc}>{t.monthlyDesc1}</Text>
              <Text style={styles.desc}>{t.monthlyDesc2}</Text>
              <Text style={styles.desc}>{t.monthlyDesc3}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.cardGold]} disabled={loading} onPress={() => handlePurchase('annuale')}>
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>{t.annualTag}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>{t.annualName}</Text>
                <Text style={styles.priceGold}>24,99 €</Text>
              </View>
              <Text style={styles.desc}>{t.annualDesc1}</Text>
              <Text style={styles.desc}>{t.annualDesc2}</Text>
            </TouchableOpacity>
          </>
        )}

        {(filter === 'all' || filter === 'lifetime') && (
          <TouchableOpacity style={[styles.card, styles.cardLifetime]} disabled={loading} onPress={() => handlePurchase('vita')}>
            <View style={styles.promoTagCyan}>
              <Text style={styles.promoTagTextDark}>{t.lifeTag}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.planName}>{t.lifeName}</Text>
              <Text style={styles.priceCyan}>24,99 €</Text>
            </View>
            <Text style={styles.desc}>{t.lifeDesc1}</Text>
            <Text style={styles.desc}>{t.lifeDesc2}</Text>
            <Text style={styles.desc}>{t.lifeDesc3}</Text>
          </TouchableOpacity>
        )}

        {filter !== 'lifetime' && (
          <TouchableOpacity style={styles.adBtn} disabled={loading} onPress={onWatchAd}>
            <Text style={styles.adBtnText}>{t.watchAdBtn}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} disabled={loading} onPress={() => setShowPaywall(false)}>
          <Text style={styles.closeBtnText}>{t.continueFree}</Text>
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
