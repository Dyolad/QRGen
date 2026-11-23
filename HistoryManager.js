import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Linking, Share, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_BAys6XNmda-GHNX6P2Db8A_YZgRU79o";

export default function HistoryManager({ history, saveHistory, triggerAlert, hasLifetime, dynamicPlan, openFilteredPaywall, t }) {
  const [archiveTab, setArchiveTab] = useState('scanned'); 
  const [confirmModal, setConfirmModal] = useState({ visible: false, type: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const executeClear = () => {
    let filtered;
    if (confirmModal.type === 'Scansionato') {
      filtered = history.filter(h => h.type !== 'Scansionato');
    } else {
      filtered = history.filter(h => h.type !== 'Statico' && h.type !== 'Dinamico');
    }
    saveHistory(filtered);
    setConfirmModal({ visible: false, type: '' });
  };

  const handleOpenLink = (content) => {
    setSelectedItem(null);
    Linking.openURL(content).catch(() => {
      if (triggerAlert) {
        triggerAlert("Info", t.plainTextInfo, "info");
      }
    });
  };

  const handleShare = async (content) => {
    try {
      await Share.share({ message: content });
    } catch (e) { console.log(e); }
  };

  const openEditDestination = async () => {
    if (dynamicPlan === 'none') {
      setSelectedItem(null);
      openFilteredPaywall(hasLifetime ? 'vip_subscriptions' : 'subscriptions');
      return;
    }

    if (dynamicPlan === 'mensile') {
      const currentEdits = parseInt(await AsyncStorage.getItem('@monthly_edits_v3') || '0', 10);
      if (currentEdits >= 10) {
        setSelectedItem(null);
        triggerAlert(t.editLimitTitle, t.editLimitMsg, "info");
        return;
      }
    }

    setNewUrlInput(selectedItem.data);
    setEditModalVisible(true);
  };
  const saveEditedDestination = async () => {
    const trimmedUrl = newUrlInput.trim();
    if (!trimmedUrl) {
      triggerAlert("Info", t.inputPlaceholder, "error");
      return;
    }

    const dbId = selectedItem.dbId || (selectedItem.qrUrl && selectedItem.qrUrl.includes('id=') ? selectedItem.qrUrl.split('id=')[1] : null);
    if (!dbId) {
      triggerAlert("Errore", "ID QR non trovato.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${dbId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ destination_url: trimmedUrl })
      });

      if (response.ok) {
        if (dynamicPlan === 'mensile') {
          const currentEdits = parseInt(await AsyncStorage.getItem('@monthly_edits_v3') || '0', 10);
          await AsyncStorage.setItem('@monthly_edits_v3', (currentEdits + 1).toString());
        }

        const updatedHistory = history.map(item => 
          item.id === selectedItem.id ? { ...item, data: trimmedUrl } : item
        );
        saveHistory(updatedHistory);
        setEditModalVisible(false);
        setSelectedItem(null);
        triggerAlert(t.editUpdatedTitle, t.editUpdatedMsg, "success");
      } else {
        triggerAlert("Errore Server", "Impossibile aggiornare su Supabase.", "error");
      }
    } catch (e) {
      triggerAlert("Errore Rete", "Controlla la connessione internet.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subSubNav}>
        <TouchableOpacity style={[styles.subTab, archiveTab === 'scanned' && styles.subTabAct]} onPress={() => setArchiveTab('scanned')}>
          <Text style={styles.tabTxt}>{t.scannedTab}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.subTab, archiveTab === 'generated' && styles.subTabAct]} onPress={() => setArchiveTab('generated')}>
          <Text style={styles.tabTxt}>{t.generatedTab}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.pad}>
        {archiveTab === 'scanned' && (
          <>
            {history.filter(h => h.type === 'Scansionato').map(h => (
              <TouchableOpacity key={h.id} style={styles.card} onPress={() => setSelectedItem(h)}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHead}>Scansionato - {h.date}</Text>
                  <Text style={styles.tapHint}>{t.tapOptions}</Text>
                </View>
                <Text style={styles.cardData} numberOfLines={1}>{h.data}</Text>
              </TouchableOpacity>
            ))}
            {history.filter(h => h.type === 'Scansionato').length === 0 && <Text style={styles.emptyTxt}>{t.noScanned}</Text>}
            {history.filter(h => h.type === 'Scansionato').length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setConfirmModal({ visible: true, type: 'Scansionato' })}>
                <Text style={styles.clearBtnT}>{t.clearScanned}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {archiveTab === 'generated' && (
          <>
            {history.filter(h => h.type === 'Statico' || h.type === 'Dinamico').map(h => (
              <TouchableOpacity key={h.id} style={styles.card} onPress={() => setSelectedItem(h)}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHead}>{h.type} - {h.date}</Text>
                  <Text style={styles.tapHint}>{t.tapOptions}</Text>
                </View>
                <Text style={styles.cardData} numberOfLines={1}>{h.data}</Text>
              </TouchableOpacity>
            ))}
            {history.filter(h => h.type === 'Statico' || h.type === 'Dinamico').length === 0 && <Text style={styles.emptyTxt}>{t.noGenerated}</Text>}
            {history.filter(h => h.type === 'Statico' || h.type === 'Dinamico').length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setConfirmModal({ visible: true, type: 'Generato' })}>
                <Text style={styles.clearBtnT}>{t.clearGenerated}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <Modal animated transparent visible={selectedItem !== null && !editModalVisible} onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#00ADB5' }]}>
            <Text style={[styles.modalTitle, { color: '#00ADB5' }]}>{selectedItem ? selectedItem.type.toUpperCase() : ''}</Text>
            <Text style={styles.modalData}>{selectedItem ? selectedItem.data : ''}</Text>
            {selectedItem && selectedItem.type === 'Dinamico' && (
              <TouchableOpacity style={styles.modalBtnEdit} onPress={openEditDestination}>
                <Text style={styles.modalBtnEditT}>{t.editDestBtn}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnAct} onPress={() => handleOpenLink(selectedItem.data)}>
                <Text style={styles.modalBtnActT}>{t.open}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnShare} onPress={() => handleShare(selectedItem.data)}>
                <Text style={styles.modalBtnShareT}>{t.share}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalBtnFullClose} onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalBtnCloseT}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#D4AF37' }]}>
            <Text style={[styles.modalTitle, { color: '#D4AF37' }]}>{t.editDestTitle}</Text>
            <TextInput style={styles.editInput} value={newUrlInput} onChangeText={setNewUrlInput} placeholder={t.inputPlaceholder} placeholderTextColor="#4E5D78" autoCapitalize="none" />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnEditSave} disabled={savingEdit} onPress={saveEditedDestination}>
                <Text style={styles.modalBtnActT}>{savingEdit ? t.savingBtn : t.saveBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnClose} disabled={savingEdit} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalBtnCloseT}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animated transparent visible={confirmModal.visible} onRequestClose={() => setConfirmModal({ visible: false, type: '' })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.clearArchiveTitle}</Text>
            <Text style={styles.modalData}>{t.clearArchiveMsg}</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnDelete} onPress={executeClear}>
                <Text style={styles.modalBtnDeleteT}>{t.delete}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnClose} onPress={() => setConfirmModal({ visible: false, type: '' })}>
                <Text style={styles.modalBtnCloseT}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  subSubNav: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15 },
  subTab: { flex: 1, padding: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#141929' },
  subTabAct: { borderBottomColor: '#00ADB5' },
  tabTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  pad: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: '#141929', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F273D' }, 
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardHead: { color: '#00ADB5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  tapHint: { color: '#637394', fontSize: 11, fontWeight: '600' },
  cardData: { color: '#FFF', fontSize: 14 },
  emptyTxt: { color: '#4E5D78', textAlign: 'center', marginTop: 30, fontSize: 14, fontWeight: '600' },
  clearBtn: { backgroundColor: '#291419', padding: 14, borderRadius: 16, alignItems: 'center', marginTop: 10, marginBottom: 30, borderWidth: 1, borderColor: '#4A1D24' },
  clearBtnT: { color: '#FF5C5C', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,8,18,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141929', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#4A1D24', alignItems: 'center' },
  modalTitle: { color: '#FF5C5C', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  modalData: { color: '#FFF', fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalRow: { flexDirection: 'row', width: '100%', gap: 10 },
  modalBtnEdit: { width: '100%', backgroundColor: '#D4AF37', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  modalBtnEditT: { color: '#090D1A', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  modalBtnEditSave: { flex: 1, backgroundColor: '#D4AF37', padding: 16, borderRadius: 16, alignItems: 'center' },
  editInput: { width: '100%', backgroundColor: '#090D1A', color: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#2F3B5C', marginBottom: 20, fontSize: 14 },
  modalBtnAct: { flex: 1, backgroundColor: '#00ADB5', padding: 15, borderRadius: 16, alignItems: 'center' },
  modalBtnActT: { color: '#090D1A', fontWeight: '800' },
  modalBtnShare: { flex: 1, backgroundColor: '#20BF6B', padding: 15, borderRadius: 16, alignItems: 'center' },
  modalBtnShareT: { color: '#FFF', fontWeight: '800' },
  modalBtnFullClose: { width: '100%', backgroundColor: '#1F273D', padding: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  modalBtnDelete: { flex: 1, backgroundColor: '#FF5C5C', padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnDeleteT: { color: '#FFF', fontWeight: '700' },
  modalBtnClose: { flex: 1, backgroundColor: '#1F273D', padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnCloseT: { color: '#A0AEC0', fontWeight: '700' }
});
