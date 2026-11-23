import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Modal, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenCapture from 'expo-screen-capture';
import * as Notifications from 'expo-notifications';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { RewardedAd, RewardedAdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import Purchases from 'react-native-purchases';
import { Paywall } from './PremiumFeatures'; 
import QRGenerator from './QRGenerator'; 
import HistoryManager from './HistoryManager'; 
import { translations, getInitialLanguage } from './translations';

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_BAys6XNmda-GHNX6P2Db8A_YZgRU79o";

const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-2667726502093063/4330980798';
const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : 'INSERISCI_QUI_IL_TUO_ID_BANNER_ADMOB';
const REVENUECAT_ANDROID_KEY = "goog_KVTeGhcGHhHsTOyFQQHaiTLlqMp";

const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [hasLifetime, setHasLifetime] = useState(false);
  const [dynamicPlan, setDynamicPlan] = useState('none');
  
  const [hasAdReward, setHasAdReward] = useState(false); 
  const [adLoaded, setAdLoaded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false); 
  const [paywallFilter, setPaywallFilter] = useState('all'); 
  const [currentTab, setCurrentTab] = useState('scanner'); 
  const [upsellModal, setUpsellingModal] = useState(false);
  const [lang, setLang] = useState('en');
  const [langModal, setLangModal] = useState(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  const t = translations[lang] || translations.en;
  const isAnyPro = hasLifetime || dynamicPlan !== 'none';
  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
      await Notifications.requestPermissionsAsync();
      try {
        const savedLang = await AsyncStorage.getItem('@app_language');
        if (savedLang && translations[savedLang]) {
          setLang(savedLang);
        } else {
          const locales = Localization.getLocales();
          const deviceCode = locales && locales.length > 0 ? locales[0].languageCode : 'en';
          setLang(getInitialLanguage(deviceCode));
        }
      } catch (e) { console.log(e); }

      try {
        await mobileAds().initialize();
      } catch (e) { console.log(e); }

      try {
        if (Platform.OS === 'android' && !REVENUECAT_ANDROID_KEY.includes('INSERISCI_QUI')) {
          Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
          const customerInfo = await Purchases.getCustomerInfo();
          
          if (customerInfo.entitlements.active['lifetime_access'] || customerInfo.allPurchasedProductIdentifiers.some(id => id.includes('lifetime'))) {
            setHasLifetime(true);
          }

          const activeDynamic = customerInfo.entitlements.active['dynamic_access'] || customerInfo.entitlements.active['pro'];
          if (activeDynamic) {
            const prodId = activeDynamic.productIdentifier || '';
            if (prodId.includes('annual')) {
              setDynamicPlan('annuale');
            } else if (prodId.includes('month')) {
              setDynamicPlan('mensile');
            }
          }
        }
      } catch (e) { console.log(e); }
    })();

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      setHasAdReward(true);
      setShowPaywall(false);
      setAdLoaded(false);
      rewarded.load();
      triggerAlert("🔋 Gettone Riscatto", "Hai sbloccato UNA singola operazione Pro!", 'success');
    });

    rewarded.load();
    loadHistory();
    ScreenCapture.preventScreenCaptureAsync();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    setLangModal(false);
    try {
      await AsyncStorage.setItem('@app_language', newLang);
    } catch (e) { console.log(e); }
  };

  const triggerAlert = (title, message, type = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  const scheduleExpiryNotification = async (days) => {
    try {
      const triggerSeconds = (days * 24 * 60 * 60) - (24 * 60 * 60); 
      if (triggerSeconds > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⚠️ AVVISO DI SCADENZA",
            body: "Il tuo codice QR dinamico scadrà tra 24 ore. Rinnova adesso per non interrompere il servizio.",
            sound: true,
          },
          trigger: { seconds: triggerSeconds },
        });
      }
    } catch (e) { console.log(e); }
  };

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('@qr_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  const saveHistory = async (newHistory) => {
    try {
      setHistory(newHistory);
      await AsyncStorage.setItem('@qr_history', JSON.stringify(newHistory));
    } catch (e) { console.log(e); }
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    let resolvedData = data;

    if (data.startsWith(`${SUPABASE_URL}/functions/v1/redirect?id=`)) {
      try {
        const idPart = data.split('id=')[1];
        const response = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${idPart}&select=destination_url`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        if (response.ok) {
          const rows = await response.json();
          if (rows && rows.length > 0 && rows[0].destination_url) {
            resolvedData = rows[0].destination_url;
          }
        }
      } catch (e) { console.log(e); }
    }

    const updatedHistory = [{ id: Date.now().toString(), data: resolvedData, type: 'Scansionato', date: new Date().toLocaleDateString() }, ...history];
    saveHistory(updatedHistory);
    setScanResult(resolvedData);
  };

  const handleWatchAd = () => {
    if (adLoaded) {
      rewarded.show();
    } else {
      triggerAlert("Info", "Pubblicità in caricamento, riprova tra qualche secondo.", "info");
      rewarded.load();
    }
  };

  const openFilteredPaywall = (filterType) => {
    setPaywallFilter(filterType);
    setShowPaywall(true);
  };

  const getBadgeText = () => {
    if (hasLifetime && dynamicPlan !== 'none') return `👑 LIFETIME + DINAMICO (${dynamicPlan.toUpperCase()})`;
    if (hasLifetime) return `👑 LIFETIME ACTIVE`;
    if (dynamicPlan !== 'none') return `👑 PRO ACTIVE (${dynamicPlan.toUpperCase()})`;
    return '';
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ width: 45 }} />
        <Text style={styles.title}>A D V A N C E D  Q R</Text>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLangModal(true)}>
          <Text style={styles.langBtnTxt}>🌐 {lang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {isAnyPro && <Text style={styles.proBadge}>{getBadgeText()}</Text>}
      {hasAdReward && !isAnyPro && <Text style={styles.adBadge}>📺 AD REWARD ACTIVE (1 USE)</Text>}
      
      <View style={styles.nav}>
        {['scanner', 'generator', 'history'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.navB, currentTab === tab && styles.navAct]} onPress={() => { setCurrentTab(tab); if(tab === 'scanner') setScanned(false); }}>
            <Text style={[styles.navTxt, currentTab === tab && styles.activeTxt]}>
              {tab === 'scanner' ? t.scanner : tab === 'generator' ? t.create : t.archive}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentTab === 'generator' && (
        <QRGenerator 
          hasLifetime={hasLifetime} dynamicPlan={dynamicPlan} hasAdReward={hasAdReward} setHasAdReward={setHasAdReward}
          openFilteredPaywall={openFilteredPaywall} history={history} saveHistory={saveHistory} triggerAlert={triggerAlert}
          setUpsellingModal={setUpsellingModal} scheduleExpiryNotification={scheduleExpiryNotification} t={t}
        />
      )}

      {currentTab === 'scanner' && (
        <View style={styles.scanBox}>
          {permission && permission.granted ? (
            <CameraView onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Text style={styles.whiteTxt} onPress={requestPermission}>{t.camPerm}</Text>
          )}
        </View>
      )}

      {currentTab === 'history' && (
        <HistoryManager 
          history={history} saveHistory={saveHistory} triggerAlert={triggerAlert} 
          hasLifetime={hasLifetime} dynamicPlan={dynamicPlan} openFilteredPaywall={openFilteredPaywall} t={t} 
        />
      )}

      <Modal animated visible={showPaywall} onRequestClose={() => setShowPaywall(false)}>
        <Paywall 
          hasLifetime={hasLifetime} setHasLifetime={setHasLifetime} setDynamicPlan={setDynamicPlan} 
          setShowPaywall={setShowPaywall} onWatchAd={handleWatchAd} filter={paywallFilter} triggerAlert={triggerAlert} t={t} 
        />
      </Modal>

      <Modal animated transparent visible={customAlert.visible} onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: customAlert.type === 'error' ? '#FF5C5C' : customAlert.type === 'success' ? '#20BF6B' : '#2F3B5C' }]}>
            <Text style={[styles.modalTitle, { color: customAlert.type === 'error' ? '#FF5C5C' : customAlert.type === 'success' ? '#20BF6B' : '#00ADB5' }]}>{customAlert.title}</Text>
            <Text style={styles.modalData}>{customAlert.message}</Text>
            <TouchableOpacity style={styles.modalBtnCloseSingle} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
              <Text style={styles.modalBtnCloseT}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={upsellModal} onRequestClose={() => setUpsellingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#D4AF37' }]}>
            <Text style={[styles.modalTitle, { color: '#D4AF37' }]}>{t.limitReachedTitle}</Text>
            <Text style={styles.modalData}>{t.limitReachedMsg}</Text>
            <TouchableOpacity style={styles.upsellBtnGold} onPress={() => { 
              setUpsellingModal(false); 
              openFilteredPaywall(hasLifetime ? 'vip_subscriptions' : 'subscriptions'); 
            }}>
              <Text style={styles.upsellBtnTextDark}>{t.upgradeAnnual}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setUpsellingModal(false)}>
              <Text style={{ color: '#637394', textDecorationLine: 'underline' }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={scanned && currentTab === 'scanner'} onRequestClose={() => setScanned(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#00ADB5' }]}>{t.detectedTitle}</Text>
            <Text style={styles.modalData}>{scanResult}</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnAct} onPress={() => { setScanned(false); Linking.openURL(scanResult).catch(() => triggerAlert("Info", t.plainTextInfo, "info")); }}>
                <Text style={styles.modalBtnActT}>{t.openLink}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnClose} onPress={() => setScanned(false)}>
                <Text style={styles.modalBtnCloseT}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={langModal} onRequestClose={() => setLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#00ADB5' }]}>{t.selectLang}</Text>
            {[
              { code: 'it', label: '🇮🇹 Italiano' },
              { code: 'en', label: '🇬🇧 English' },
              { code: 'es', label: '🇪🇸 Español' },
              { code: 'fr', label: '🇫🇷 Français' },
              { code: 'de', label: '🇩🇪 Deutsch' }
            ].map(item => (
              <TouchableOpacity key={item.code} style={[styles.upsellBtnDark, lang === item.code && { borderColor: '#00ADB5' }]} onPress={() => changeLanguage(item.code)}>
                <Text style={styles.upsellBtnTextLight}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setLangModal(false)}>
              <Text style={{ color: '#637394', textDecorationLine: 'underline' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!isAnyPro && (
        <View style={{ alignItems: 'center', backgroundColor: '#090D1A', paddingBottom: 5 }}>
          <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 5 },
  langBtn: { backgroundColor: '#141929', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#1F273D' },
  langBtnTxt: { color: '#00ADB5', fontSize: 11, fontWeight: '800' },
  container: { flex: 1, backgroundColor: '#090D1A', paddingTop: 60 }, 
  title: { color: '#FFF', fontSize: 16, fontWeight: '300', textAlign: 'center', marginBottom: 5, letterSpacing: 4 },
  proBadge: { color: '#D4AF37', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  adBadge: { color: '#00ADB5', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  nav: { flexDirection: 'row', backgroundColor: '#141929', marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 5, borderWidth: 1, borderColor: '#1F273D' },
  navB: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 15 },
  navAct: { backgroundColor: '#1F273D' }, navTxt: { color: '#637394', fontWeight: '700', fontSize: 14 }, activeTxt: { color: '#FFF' },
  whiteTxt: { color: '#637394', textAlign: 'center', marginTop: 20 }, scanBox: { flex: 1, backgroundColor: '#000', marginBottom: 20, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,8,18,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141929', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2F3B5C', alignItems: 'center' },
  modalTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 }, modalData: { color: '#FFF', fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 },
  modalBtnAct: { flex: 1, backgroundColor: '#00ADB5', paddingVertical: 15, paddingHorizontal: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBtnActT: { color: '#090D1A', fontWeight: '800', fontSize: 14 },
  modalBtnClose: { flex: 1, backgroundColor: '#1F273D', paddingVertical: 15, paddingHorizontal: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2F3B5C' },
  modalBtnCloseSingle: { backgroundColor: '#1F273D', padding: 16, borderRadius: 16, alignItems: 'center', width: '100%', marginTop: 5 },
  modalBtnCloseT: { color: '#FFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  upsellBtnGold: { backgroundColor: '#D4AF37', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  upsellBtnDark: { backgroundColor: '#1F273D', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#2F3B5C' },
  upsellBtnTextDark: { color: '#090D1A', fontWeight: '800', fontSize: 14 }, upsellBtnTextLight: { color: '#FFF', fontWeight: '700', fontSize: 14 }
});
