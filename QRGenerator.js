import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_BAys6XNmda-GHNX6P2Db8A_YZgRU79o";

export default function QRGenerator({ isPremium, premiumType, hasAdReward, setHasAdReward, openFilteredPaywall, history, saveHistory, triggerAlert, setUpsellingModal, scheduleExpiryNotification }) {
  const [text, setText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [logoUri, setLogoUri] = useState(null);
  const [totalDynamicCount, setTotalDynamicCount] = useState(0);
  const [adDynamicCount, setAdDynamicCount] = useState(0);
  const svgRef = useRef(null);
  const RICKROLL_PREVIEW_URL = "https://youtube.com";

  useEffect(() => {
    (async () => {
      try {
        const storedTotal = await AsyncStorage.getItem('@total_dynamic_count');
        const storedAd = await AsyncStorage.getItem('@ad_dynamic_count');
        if (storedTotal) setTotalDynamicCount(parseInt(storedTotal, 10));
        if (storedAd) setAdDynamicCount(parseInt(storedAd, 10));
      } catch (e) { console.log(e); }
    })();
  }, []);

  const incrementCounters = async (isAd) => {
    try {
      const newTotal = totalDynamicCount + 1;
      setTotalDynamicCount(newTotal);
      await AsyncStorage.setItem('@total_dynamic_count', newTotal.toString());
      if (isAd) {
        const newAd = adDynamicCount + 1;
        setAdDynamicCount(newAd);
        await AsyncStorage.setItem('@ad_dynamic_count', newAd.toString());
      }
    } catch (e) { console.log(e); }
  };

  const checkAccessAndExecute = (actionType, targetType, successCallback) => {
    if (isPremium) {
      if (premiumType === 'mensile' && totalDynamicCount >= 10 && actionType === 'download') {
        setUpsellingModal(true);
        return;
      }
      if (targetType === 'statico' && premiumType !== 'vita') {
        openFilteredPaywall('lifetime');
        return;
      }
      successCallback(false);
      return;
    }
    if (hasAdReward) {
      if (targetType === 'statico') {
        openFilteredPaywall('lifetime');
        return;
      }
      if (actionType === 'download' && targetType === 'dinamico' && adDynamicCount >= 3) {
        triggerAlert("Limite Raggiunto", "Hai esaurito i 3 QR Dinamici gratuiti con pubblicità. Passa a Pro per continuare!", "error");
        openFilteredPaywall('subscriptions');
        return;
      }
      successCallback(true);
      setHasAdReward(false); 
      triggerAlert("Gettone Consumato", "Azione Premium completata!", "success");
      return;
    }
    openFilteredPaywall(targetType === 'statico' ? 'lifetime' : 'subscriptions');
  };

  const pickLogoImage = () => {
    checkAccessAndExecute('customization', 'dinamico', async () => {
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
        setLogoUri(result.assets[0].uri);
      }
    });
  };

  const handleDownload = (type) => {
    if (!text.trim()) {
      triggerAlert("Attenzione", "Digita un contenuto.", "info");
      return;
    }
    checkAccessAndExecute('download', type, async (usedAd) => {
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
          const response = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes`, {
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
            finalQRValue = `${SUPABASE_URL}/redirect?id=${Date.now()}`;
            await incrementCounters(usedAd);
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
            <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, qrColor === c && styles.colorDotAct]} onPress={() => { if (c !== '#000000') { checkAccessAndExecute('customization', 'dinamico', () => setQrColor(c)); } else { setQrColor(c); } }} />
          ))}
        </View>
        {text.trim() ? (
          <View style={styles.centerWrapper}>
            <View style={styles.qrBox}>
              <QRCode getRef={(c) => (svgRef.current = c)} value={RICKROLL_PREVIEW_URL} size={180} color={qrColor} backgroundColor="#FFF" logo={logoUri ? { uri: logoUri } : null} logoSize={42} logoBackgroundColor='white' logoBorderRadius={8} />
            </View>
            <TouchableOpacity style={styles.downBtnDynamic} onPress={() => handleDownload('dinamico')}><Text style={styles.downBtnText}>💾 SCARICA DINAMICO</Text></TouchableOpacity>
            <TouchableOpacity style={styles.downBtnStatic} onPress={() => handleDownload('statico')}><Text style={styles.downBtnText}>👑 SCARICA STATICO</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>Digita qualcosa per l'anteprima...</Text></View>
        )}
      </ScrollView>
    </View>
  );
}
