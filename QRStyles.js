import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
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
  centerWrapper: { alignItems: 'center', marginTop: 10, width: '100%' },
  qrBox: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 24, width: 228, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, marginBottom: 20 },
  emptyBox: { marginTop: 10, height: 228, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1F273D', borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#4E5D78', textAlign: 'center', fontSize: 14, fontWeight: '600' },
  downBtnDynamic: { backgroundColor: '#20BF6B', width: 250, padding: 16, borderRadius: 18, marginBottom: 12, alignItems: 'center' },
  downBtnStatic: { backgroundColor: '#D4AF37', width: 250, padding: 16, borderRadius: 18, alignItems: 'center' },
  downBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }
});
