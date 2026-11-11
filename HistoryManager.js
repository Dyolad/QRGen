import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Linking, Share } from 'react-native';

export default function HistoryManager({ history, saveHistory, triggerAlert, t }) {
  const [archiveTab, setArchiveTab] = useState('scanned'); 
  const [confirmModal, setConfirmModal] = useState({ visible: false, type: '' });
  const [selectedItem, setSelectedItem] = useState(null);

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

      <Modal animated transparent visible={selectedItem !== null} onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#00ADB5' }]}>
            <Text style={[styles.modalTitle, { color: '#00ADB5' }]}>{selectedItem ? selectedItem.type.toUpperCase() : ''}</Text>
            <Text style={styles.modalData}>{selectedItem ? selectedItem.data : ''}</Text>
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
