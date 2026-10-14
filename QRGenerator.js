import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_BAys6XNmda-GHNX6P2Db8A_YZgRU79o";

export default function QRGenerator({ isPremium, premiumType, hasAdReward, setHasAdReward, setShowPaywall, history, saveHistory, triggerAlert, setUpsellingModal, scheduleExpiryNotification }) {
  const [text, setText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [logoUri, setLogoUri] = useState(null);
  const svgRef = useRef(null);
  const RICKROLL_PREVIEW_URL = "https://youtube.com";

  const checkAccessAndExecute = (actionType, successCallback) => {
    if (isPremium) {
      if (premiumType === 'mensile' && history.filter(h => h.type === 'Dinamico').length >= 10 && actionType === 'download_dynamic') {
        setUpsellingModal(true);
        return;
      }
      successCallback();
      return;
    }
    if (hasAdReward) {
      successCallback();
      setHasAdReward(false); 
      triggerAlert("Gettone Consumato", "Azione Premium completata!", "success");
      return;
    }
    setShowPaywall(true);
  };

  const pickLogoImage = () => {
    checkAccessAndExecute('customization', async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        triggerAlert("Permesso Negato", "Consenti l'accesso alla galleria.", "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets.uri);
      }
    });
  };

  const handleDownload = (type) => {
    if (!text.trim()) {
      triggerAlert("Attenzione", "Digita un contenuto.", "info");
      return;
    }
    if (type === 'statico' && premiumType !== 'vita') {
      setShowPaywall(true);
      return;
    }
    checkAccessAndExecute(type === 'statico' ? 'download_static' : 'download_dynamic', async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        triggerAlert("Permesso Negato", "Abilita i permessi di archiviazione.", "error");
        return;
      }
      let finalQRValue = text;
      if (type === 'dinamico') {
        try {
          const daysToLive = premiumType === 'none' ? 7 : 30;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + daysToLive);
          const response = await fetch(`${SUPABASE_URL}qr_codes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              destination_url: text,
              is_dynamic: true,
              expires_at: expiryDate.toISOString(),
              premium_type: premiumType,
              has_watermark: premiumType === 'none'
            })
          });
          if (response.ok) {
            finalQRValue = `${SUPABASE_URL}redirect?id=${Date.now()}`;
            if (premiumType === 'none') scheduleExpiryNotification(7);
          }
        } catch (err) { console.log(err); }
      }
      if (svgRef.current) {
        svgRef.current.toDataURL(async (dataURL) => {
          try {
            const path = `${FileSystem.documentDirectory}QR_${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(path, dataURL, { encoding: FileSystem.EncodingType.Base64 });
            await MediaLibrary.saveToLibraryAsync(path);
            saveHistory([{ id: Date.now().toString(), data: finalQRValue, type: type === 'dinamico' ? 'Dinamico' : 'Statico', date: new Date().toLocaleDateString() }, ...history]);
            triggerAlert("🏆 Scaricato!", "Codice salvato in Galleria.", "success");
          } catch (err) { triggerAlert("Errore", "Impossibile scaricare.", "error"); }
        });
      }
    });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.input} placeholder="Inserisci il link..." placeholderTextColor="#4E5D78" value={text} onChangeText={setText} />
        <Text style={styles.sectionLabel}>Logo Centrale:</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.toggleBtn, logoUri && styles.toggleAct, { marginRight: logoUri ? 10 : 0 }]} onPress={pickLogoImage}>
            <Text style={styles.whiteTxt}>{logoUri ? '🖼️ Modifica Logo' : '📁 Carica Logo'}</Text>
          </TouchableOpacity>
          {logoUri && <TouchableOpacity style={styles.removeBtn} onPress={() => setLogoUri(null)}><Text style={styles.removeBtnT}>Rimuovi</Text></TouchableOpacity>}
        </View>
        <Text style={styles.sectionLabel}>Personalizza Colore:</Text>
        <View style={styles.colorRow}>
          {['#000000', '#FF5733', '#20BF6B', '#3867D6'].map(c => (
            <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, qrColor === c && styles.colorDotAct]} onPress={() => { if (c !== '#000000') { checkAccessAndExecute('customization', () => setQrColor(c)); } else { setQrColor(c); } }} />
          ))}
        </View>
        {text.trim() ? (
          <View style={styles.centerWrapper}>
            <View style={styles.qrBox}>
              <QRCode getRef={(c) => (svgRef.current = c)} value={RICKROLL_PREVIEW_URL} size={180} color={qrColor} backgroundColor="#FFF" logo={logoUri ? { uri: logoUri } : null} logoSize={42} logoBackgroundColor='white' logoBorderRadius={8} />
            </View>
            <TouchableOpacity style={styles.downBtnDynamic} onPress={() => handleDownload('dinamico')}><Text style={styles.downBtnText}>💾 SCARICA DINAMICO</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.downBtnStatic, premiumType !== 'vita' && { opacity: 0.5 }]} onPress={() => handleDownload('statico')}><Text style={styles.downBtnText}>👑 SCARICA STATICO</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>Digita qualcosa per l'anteprima...</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 }, scrollContainer: { flex: 1 }, scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  input: { backgroundColor: '#141929', color: '#FFF', padding: 18, borderRadius: 16, marginBottom: 20, fontSize: 15, borderWidth: 1, borderColor: '#1F273D' },
  row: { flexDirection: 'row', marginBottom: 15 },
  toggleBtn: { backgroundColor: '#141929', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1F273D', flex: 1, alignItems: 'center' },
  toggleAct: { backgroundColor: '#00ADB5', borderColor: '#00ADB5' },
  removeBtn: { backgroundColor: '#291419', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#4A1D24', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  removeBtnT: { color: '#FF5C5C', fontWeight: '700', fontSize: 14 }, whiteTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sectionLabel: { color: '#637394', marginBottom: 10, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  colorRow: { flexDirection: 'row', marginBottom: 25 }, colorDot: { width: 40, height: 40, borderRadius: 20, marginRight: 15, borderWidth: 3, borderColor: '#141929' }, colorDotAct: { borderColor: '#00ADB5' },
  centerWrapper: { alignItems: 'center', marginTop: 10, width: '100%' }, qrBox: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 24, width: 228, marginBottom: 20 },
  emptyBox: { marginTop: 10, height: 228, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1F273D', borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#4E5D78', textAlign: 'center', fontSize: 14, fontWeight: '600' },
  downBtnDynamic: { backgroundColor: '#20BF6B', width: 250, padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  downBtnStatic: { backgroundColor: '#D4AF37', width: 250, padding: 16, borderRadius: 18, alignItems: 'center' },
  downBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 }
});
