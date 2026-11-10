import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

const SUPABASE_URL = "https://bgaajjgdyeyfblfxasxb.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWFqamdkeWV5ZmJsZnhhc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTU0MTMsImV4cCI6MjEwNzU3MTQxM30.-hIIgm5ib6tJWCmwKRumeatYMQJan6WYK-MLH_zhYt8";

export default function QRGenerator({ isPremium, premiumType, hasAdReward, setHasAdReward, openFilteredPaywall, history, saveHistory, triggerAlert, setUpsellingModal, scheduleExpiryNotification }) {
  const [text, setText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [logoUri, setLogoUri] = useState(null);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [adActionCount, setAdActionCount] = useState(0);
  const [realQrValueForExport, setRealQrValueForExport] = useState('');
  const downloadSvgRef = useRef(null);
  const RICKROLL_PREVIEW_URL = "https://youtu.be" + "dQw4w9WgXcQ";

  useEffect(() => {
    (async () => {
      try {
        const storedMonthly = await AsyncStorage.getItem('@monthly_qr_v3');
        const storedAd = await AsyncStorage.getItem('@ad_uses_v3');
        if (storedMonthly) setMonthlyCount(parseInt(storedMonthly, 10));
        if (storedAd) setAdActionCount(parseInt(storedAd, 10));
      } catch (e) { console.log(e); }
    })();
  }, []);

  const cleanAndShortenUrl = (rawInput) => {
    let clean = rawInput.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return clean;
    }
    try {
      const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch && ytMatch[1]) {
        return "https://youtu.be" + ytMatch[1];
      }
      const urlObj = new URL(clean);
      const paramsToRemove = ['si', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
      paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
      return urlObj.toString();
    } catch (e) {
      return clean;
    }
  };

  const recordAdUse = async () => {
    try {
      const nextAd = adActionCount + 1;
      setAdActionCount(nextAd);
      await AsyncStorage.setItem('@ad_uses_v3', nextAd.toString());
    } catch (e) { console.log(e); }
  };

  const recordMonthlyQr = async () => {
    try {
      const nextMonthly = monthlyCount + 1;
      setMonthlyCount(nextMonthly);
      await AsyncStorage.setItem('@monthly_qr_v3', nextMonthly.toString());
    } catch (e) { console.log(e); }
  };

  const checkAccessAndExecute = async (actionType, targetType, successCallback) => {
    if (isPremium) {
      if (premiumType === 'mensile' && actionType === 'download' && targetType === 'dinamico') {
        const extra = parseInt(await AsyncStorage.getItem('@extra_slots_v3') || '0', 10);
        if (monthlyCount >= (20 + extra)) {
          setUpsellingModal(true);
          return;
        }
      }
      if (targetType === 'statico' && premiumType !== 'vita') {
        openFilteredPaywall('lifetime');
        return;
      }
      successCallback(false);
      return;
    }

    if (adActionCount >= 5) {
      setHasAdReward(false);
      triggerAlert("Limite Pubblicità Raggiunto", "Hai esaurito le 5 azioni gratuite con pubblicità. Scegli un piano Pro!", "error");
      openFilteredPaywall(targetType === 'statico' ? 'lifetime' : 'subscriptions');
      return;
    }

    if (hasAdReward) {
      if (targetType === 'statico') {
        openFilteredPaywall('lifetime');
        return;
      }
      setHasAdReward(false);
      successCallback(true);
      return;
    }

    openFilteredPaywall(targetType === 'statico' ? 'lifetime' : 'subscriptions');
  };
  const pickLogoImage = () => {
    checkAccessAndExecute('customization', 'dinamico', async (usedAd) => {
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
        if (usedAd) await recordAdUse();
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

      const optimizedContent = cleanAndShortenUrl(text);
      let finalQRValue = optimizedContent;
      let recordId = Date.now().toString();

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
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              destination_url: optimizedContent,
              is_dynamic: true,
              expires_at: expiryDate.toISOString(),
              premium_type: premiumType,
              has_watermark: premiumType === 'none'
            })
          });
          if (response.ok) {
            const data = await response.json();
            const dbId = (data && data[0] && data[0].id) ? data[0].id : recordId;
            finalQRValue = `${SUPABASE_URL}/functions/v1/redirect?id=${dbId}`;
            if (premiumType === 'mensile') await recordMonthlyQr();
            if (usedAd) await recordAdUse();
            if (premiumType === 'none') scheduleExpiryNotification(7);
          } else {
            triggerAlert("Errore Server", "Impossibile salvare il QR Dinamico su Supabase.", "error");
            return;
          }
        } catch (err) {
          triggerAlert("Errore Rete", "Controlla la connessione internet.", "error");
          return;
        }
      } else if (usedAd) {
        await recordAdUse();
      }

      setRealQrValueForExport(finalQRValue);

      setTimeout(() => {
        if (downloadSvgRef.current) {
          downloadSvgRef.current.toDataURL(async (dataURL) => {
            try {
              const path = `${FileSystem.documentDirectory}QR_${Date.now()}.png`;
              await FileSystem.writeAsStringAsync(path, dataURL, { encoding: FileSystem.EncodingType.Base64 });
              await MediaLibrary.saveToLibraryAsync(path);
              saveHistory([{ id: recordId, data: optimizedContent, qrUrl: finalQRValue, type: type === 'dinamico' ? 'Dinamico' : 'Statico', date: new Date().toLocaleDateString() }, ...history]);
              triggerAlert("🏆 Scaricato!", "Codice salvato in Galleria.", "success");
            } catch (err) { triggerAlert("Errore", "Impossibile salvare immagine.", "error"); }
          });
        }
      }, 150);
    });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.input} placeholder="Inserisci il link o testo..." placeholderTextColor="#4E5D78" value={text} onChangeText={setText} />
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
            <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, qrColor === c && styles.colorDotAct]} onPress={() => { 
              if (c !== '#000000') { 
                checkAccessAndExecute('customization', 'dinamico', async (usedAd) => {
                  setQrColor(c);
                  if (usedAd) await recordAdUse();
                }); 
              } else { 
                setQrColor(c); 
              } 
            }} />
          ))}
        </View>
        {text.trim() ? (
          <View style={styles.centerWrapper}>
            <View style={styles.qrBox}>
              <QRCode value={RICKROLL_PREVIEW_URL} size={180} color={qrColor} backgroundColor="#FFF" logo={logoUri ? { uri: logoUri } : null} logoSize={42} logoBackgroundColor='white' logoBorderRadius={8} />
            </View>
            <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
              <QRCode getRef={(c) => (downloadSvgRef.current = c)} value={realQrValueForExport || "https://example.com"} size={300} color={qrColor} backgroundColor="#FFF" logo={logoUri ? { uri: logoUri } : null} logoSize={70} logoBackgroundColor='white' logoBorderRadius={12} />
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
