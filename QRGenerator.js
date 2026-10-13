import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenCapture from 'expo-screen-capture';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paywall } from './PremiumFeatures'; 
import QRGenerator from './QRGenerator'; 
import HistoryManager from './HistoryManager'; 

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isPremium, setIsPremium] = useState(false); 
  const [hasAdReward, setHasAdReward] = useState(false); 
  const [showPaywall, setShowPaywall] = useState(false); 
  const [currentTab, setCurrentTab] = useState('scanner'); 
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
    loadHistory();
    ScreenCapture.preventScreenCaptureAsync(); 
  }, []);

  const triggerAlert = (title, message, type = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
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

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    if (data.includes('qr-pro-dynamic/free-') && !isPremium) {
      triggerAlert("Link Scaduto", "Questo codice QR dinamico temporaneo è scaduto. Passa a Premium per sbloccarlo.", 'error');
      setScanned(false);
      return;
    }
    if (!isPremium && history.filter(h => h.type === 'Scansionato').length >= 5) { 
      setShowPaywall(true); 
      setScanned(false);
      return; 
    }
    const updatedHistory = [{ id: Date.now().toString(), data, type: 'Scansionato', date: new Date().toLocaleDateString() }, ...history];
    saveHistory(updatedHistory);
    setScanResult(data);
  };

  const handleWatchAd = () => {
    setHasAdReward(true); 
    setShowPaywall(false);
    triggerAlert("🔋 Gettone Riscatto", "Hai sbloccato UNA singola operazione Pro con la pubblicità!", 'success');
  };

  if (showPaywall) {
    return <Paywall setIsPremium={setIsPremium} setShowPaywall={setShowPaywall} onWatchAd={handleWatchAd} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>A D V A N C E D  Q R</Text>
      {isPremium && <Text style={styles.proBadge}>👑 PRO ACTIVE</Text>}
      {hasAdReward && !isPremium && <Text style={styles.adBadge}>📺 AD REWARD ACTIVE (1 USE)</Text>}
      
      <View style={styles.nav}>
        {['scanner', 'generator', 'history'].map(t => (
          <TouchableOpacity key={t} style={[styles.navB, currentTab === t && styles.navAct]} onPress={() => setCurrentTab(t)}>
            <Text style={[styles.navTxt, currentTab === t && styles.activeTxt]}>
              {t === 'scanner' ? 'Scanner' : t === 'generator' ? 'Crea' : 'Archivio'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentTab === 'generator' && (
        <QRGenerator 
          isPremium={isPremium} 
          hasAdReward={hasAdReward}
          setHasAdReward={setHasAdReward}
          setShowPaywall={setShowPaywall} 
          history={history} 
          saveHistory={saveHistory} 
          triggerAlert={triggerAlert}
        />
      )}

      {currentTab === 'scanner' && (
        <View style={styles.scanBox}>
          {permission && permission.granted ? (
            <CameraView onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Text style={styles.whiteTxt}>In attesa dei permessi video...</Text>
          )}
        </View>
      )}

      {currentTab === 'history' && (
        <HistoryManager history={history} saveHistory={saveHistory} triggerAlert={triggerAlert} />
      )}

      <Modal animated transparent visible={customAlert.visible} onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: customAlert.type === 'error' ? '#FF5C5C' : customAlert.type === 'success' ? '#20BF6B' : '#2F3B5C' }]}>
            <Text style={[styles.modalTitle, { color: customAlert.type === 'error' ? '#FF5C5C' : customAlert.type === 'success' ? '#20BF6B' : '#00ADB5' }]}>{customAlert.title}</Text>
            <Text style={styles.modalData}>{customAlert.message}</Text>
            <TouchableOpacity style={styles.modalBtnClose} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
              <Text style={styles.modalBtnCloseT}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={scanned && currentTab === 'scanner'} onRequestClose={() => setScanned(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CONTENUTO RILEVATO</Text>
            <Text style={styles.modalData}>{scanResult}</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnAct} onPress={() => { setScanned(false); Linking.openURL(scanResult).catch(() => triggerAlert("Oops", "Impossibile aprire il testo come URL", "info")); }}>
                <Text style={styles.modalBtnActT}>Apri Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnClose} onPress={() => setScanned(false)}>
                <Text style={styles.modalBtnCloseT}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D1A', paddingTop: 60 }, 
  title: { color: '#FFF', fontSize: 16, fontWeight: '300', textAlign: 'center', marginBottom: 5, letterSpacing: 4 },
  proBadge: { color: '#D4AF37', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  adBadge: { color: '#00ADB5', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  nav: { flexDirection: 'row', backgroundColor: '#141929', marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 5, borderWidth: 1, borderColor: '#1F273D' },
  navB: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 15 },
  navAct: { backgroundColor: '#1F273D' },
  navTxt: { color: '#637394', fontWeight: '700', fontSize: 14 },
  activeTxt: { color: '#FFF' },
  whiteTxt: { color: '#637394', textAlign: 'center', marginTop: 20 },
  scanBox: { flex: 1, backgroundColor: '#000', marginBottom: 20, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,8,18,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141929', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2F3B5C', alignItems: 'center' },
  modalTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  modalData: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalRow: { flexDirection: 'row', width: '100%' },
  modalBtnAct: { flex: 1, backgroundColor: '#00ADB5', padding: 16, borderRadius: 16, alignItems: 'center', marginRight: 10 },
  modalBtnActT: { color: '#FFF', fontWeight: '700' },
  modalBtnClose: { flex: 1, backgroundColor: '#1F273D', padding: 16, borderRadius: 16, alignItems: 'center', minWidth: 100 },
  modalBtnCloseT: { color: '#A0AEC0', fontWeight: '700' }
});
