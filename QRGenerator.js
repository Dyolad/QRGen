import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function QRGenerator({ isPremium, hasAdReward, setHasAdReward, setShowPaywall, history, saveHistory, triggerAlert }) {
  const [text, setText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [isDynamic, setIsDynamic] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const svgRef = useRef(null);

  const checkAccessAndExecute = (successCallback) => {
    if (isPremium) {
      successCallback();
      return;
    }
    if (hasAdReward) {
      successCallback();
      setHasAdReward(false); 
      triggerAlert("Gettone Consumato", "Operazione Premium completata con successo!", "success");
      return;
    }
    setShowPaywall(true);
  };

  const pickLogoImage = async () => {
    checkAccessAndExecute(async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        triggerAlert("Permesso Negato", "Devi consentire l'accesso alla galleria per inserire un logo.", "error");
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

  const handleDownloadQR = async () => {
    if (!text.trim()) {
      triggerAlert("Attenzione", "Digita un contenuto per generare il codice QR.", "info");
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      triggerAlert("Permesso Negato", "Abilita i permessi di archiviazione per salvare l'immagine.", "error");
      return;
    }

    if (svgRef.current) {
      svgRef.current.toDataURL(async (dataURL) => {
        try {
          const path = `${FileSystem.documentDirectory}QR_${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(path, dataURL, { encoding: FileSystem.EncodingType.Base64 });
          await MediaLibrary.saveToLibraryAsync(path);

          const finalValue = isDynamic ? `https://qr-pro-dynamic/free-${Date.now()}` : text;
          const newHistoryElement = {
            id: Date.now().toString(),
            data: finalValue,
            type: isDynamic ? 'Dinamico' : 'Statico',
            date: new Date().toLocaleDateString()
          };
          saveHistory([newHistoryElement, ...history]);

          triggerAlert("🏆 Salvato!", "Il codice QR è in Galleria ed è stato inserito nell'Archivio Generati.", "success");
        } catch (err) {
          triggerAlert("Errore", "Impossibile completare il download del file.", "error");
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Inserisci il link o il testo..."
        placeholderTextColor="#4E5D78"
        value={text}
        onChangeText={setText}
      />

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.toggleBtn, isDynamic && styles.toggleAct]} 
          onPress={() => {
            const nextState = !isDynamic;
            if (nextState) {
              checkAccessAndExecute(() => setIsDynamic(true));
            } else {
              setIsDynamic(false);
            }
          }}
        >
          <Text style={styles.whiteTxt}>{isDynamic ? '🔗 Dynamic Link Active' : '🔒 Upgrade to Dynamic'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Logo Centrale:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.toggleBtn, logoUri && styles.toggleAct, { marginRight: logoUri ? 10 : 0 }]} onPress={pickLogoImage}>
          <Text style={styles.whiteTxt}>{logoUri ? '🖼️ Change Brand Logo' : '📁 Upload Central Logo'}</Text>
        </TouchableOpacity>
        {logoUri && (
          <TouchableOpacity style={styles.removeBtn} onPress={() => setLogoUri(null)}>
            <Text style={styles.removeBtnT}>Rimuovi</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabel}>Personalizza Colore (Premium):</Text>
      <View style={styles.colorRow}>
        {['#000000', '#FF5733', '#20BF6B', '#3867D6'].map(c => (
          <TouchableOpacity 
            key={c} 
            style={[styles.colorDot, { backgroundColor: c }, qrColor === c && styles.colorDotAct]} 
            onPress={() => {
              if (c !== '#000000') {
                checkAccessAndExecute(() => setQrColor(c));
              } else {
                setQrColor(c);
              }
            }}
          />
        ))}
      </View>

      {text.trim() ? (
        <View style={{ alignItems: 'center' }}>
          <View style={styles.qrBox}>
            <QRCode 
              getRef={(c) => (svgRef.current = c)}
              value={isDynamic ? `https://qr-pro-dynamic/free-preview` : text} 
              size={180} 
              color={qrColor} 
              backgroundColor="#FFF"
              logo={logoUri ? { uri: logoUri } : null}
              logoSize={42}
              logoBackgroundColor='white'
              logoBorderRadius={8}
            />
          </View>
          <TouchableOpacity style={styles.downBtn} onPress={handleDownloadQR}>
            <Text style={styles.downBtnT}>💾 SALVA IN GALLERIA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Digita qualcosa per vedere l'anteprima in tempo reale</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  input: { backgroundColor: '#141929', color: '#FFF', padding: 18, borderRadius: 16, marginBottom: 20, fontSize: 15, borderWidth: 1, borderColor: '#1F273D' },
  row: { flexDirection: 'row', marginBottom: 15 },
  toggleBtn: { backgroundColor: '#141929', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1F273D', flex: 1, alignItems: 'center' },
  toggleAct: { backgroundColor: '#00ADB5', borderColor: '#00ADB5' },
  removeBtn: { backgroundColor: '#291419', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#4A1D24', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  removeBtnT: { color: '#FF5C5C', fontWeight: '700', fontSize: 14 },
  whiteTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sectionLabel: { color: '#637394', marginBottom: 10, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  colorRow: { flexDirection: 'row', marginBottom: 25 },
  colorDot: { width: 40, height: 40, borderRadius: 20, marginRight: 15, borderWidth: 3, borderColor: '#141929' },
  colorDotAct: { borderColor: '#00ADB5' },
  qrBox: { marginTop: 10, alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 24, width: 228, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10 },
  emptyBox: { marginTop: 10, height: 228, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1F273D', borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#4E5D78', textAlign: 'center', fontSize: 14, fontWeight: '600' },
  downBtn: { backgroundColor: '#20BF6B', width: 228, padding: 16, borderRadius: 18, marginTop: 15, alignItems: 'center', shadowColor: '#20BF6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  downBtnT: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }
});
