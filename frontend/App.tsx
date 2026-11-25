import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Location from 'expo-location'
import { Camera, CameraType } from 'expo-camera'
import type { CameraCapturedPicture } from 'expo-camera'
import { getMyReports, getToilet, getNearby, searchToilets, submitIssue, submitStatus, uploadReportImage, loginAccount, registerAccount, restoreAccount, logoutAccount } from './src/services/toiletApi'
import { openDirections } from './src/services/mapScheme'
import { uploadImageForAnalysis } from './src/services/imageAnalysis'
import type { AccountUser, HygieneStatus, IssueType, MyReport, ToiletDetail, ToiletSummary } from './src/services/toiletApi'

type Tab = 'search' | 'reports' | 'account'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:8080/api/v1`

export default function App() {
  const [tab, setTab] = useState<Tab>('search')
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<ToiletSummary[]>([])
  const [selected, setSelected] = useState<ToiletDetail | null>(null)
  const [reports, setReports] = useState<MyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null)
  const [accountName, setAccountName] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountMode, setAccountMode] = useState<'login' | 'register'>('login')
  const [accountBusy, setAccountBusy] = useState(false)

  useEffect(() => {
    void search('')
    void restoreAccount(API_BASE_URL).then(setAccountUser)
  }, [])

  async function search(value = keyword) {
    setLoading(true); setError(''); setSelected(null)
    try { setItems(await searchToilets(API_BASE_URL, value.trim())) }
    catch (cause) { setItems([]); setError(errorMessage(cause)) }
    finally { setLoading(false) }
  }

  async function nearby() {
    setLoading(true); setError(''); setSelected(null)
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') throw new Error('주변 검색을 위해 위치 권한을 허용해 주세요.')
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setItems(await getNearby(API_BASE_URL, { latitude: position.coords.latitude, longitude: position.coords.longitude }))
    } catch (cause) { setItems([]); setError(errorMessage(cause)) }
    finally { setLoading(false) }
  }

  async function openDetail(id: number) {
    setLoading(true); setError('')
    try { setSelected(await getToilet(API_BASE_URL, id)) }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setLoading(false) }
  }

  async function openReports() {
    setTab('reports'); setLoading(true); setError('')
    try { setReports(await getMyReports(API_BASE_URL)) }
    catch (cause) { setReports([]); setError(errorMessage(cause)) }
    finally { setLoading(false) }
  }

  async function submitAccount() {
    setAccountBusy(true); setError('')
    try {
      const user = accountMode === 'login'
        ? await loginAccount(API_BASE_URL, accountName, accountPassword)
        : await registerAccount(API_BASE_URL, accountName, accountPassword)
      setAccountUser(user); setAccountPassword(''); setTab('reports'); void openReports()
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setAccountBusy(false) }
  }

  async function signOut() {
    setAccountBusy(true)
    try { await logoutAccount(API_BASE_URL); setAccountUser(null); setReports([]); setError('로그아웃되었습니다.') }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setAccountBusy(false) }
  }

  async function reportStatus(data: { hasTissue: boolean; hygieneStatus: HygieneStatus; isOpen: boolean; comment: string }, imageUri?: string) {
    if (!selected || reporting) return
    setReporting(true)
    try {
      const reportId = await submitStatus(API_BASE_URL, selected.id, data)
      if (imageUri) {
        try { await uploadReportImage(API_BASE_URL, 'TOILET_STATUS', reportId, selected.id, imageUri) }
        catch (photoError) { Alert.alert('제보는 저장됨', `사진은 저장하지 못했습니다. ${errorMessage(photoError)}`); return }
      }
      Alert.alert('제보 접수', imageUri ? '현장 상태와 사진이 저장되었습니다.' : '현장 상태 제보가 저장되었습니다.')
      setSelected(await getToilet(API_BASE_URL, selected.id))
    } catch (cause) { Alert.alert('제보 실패', errorMessage(cause)) }
    finally { setReporting(false) }
  }

  async function reportIssue(issueType: IssueType, content: string, imageUri?: string) {
    if (!selected || reporting) return
    setReporting(true)
    try {
      const reportId = await submitIssue(API_BASE_URL, selected.id, issueType, content)
      if (imageUri) {
        try { await uploadReportImage(API_BASE_URL, 'ISSUE', reportId, selected.id, imageUri) }
        catch (photoError) { Alert.alert('신고는 저장됨', `사진은 저장하지 못했습니다. ${errorMessage(photoError)}`); return }
      }
      Alert.alert('신고 접수', imageUri ? '오류 신고와 사진이 저장되었습니다.' : '오류 신고가 저장되었습니다.')
    } catch (cause) { Alert.alert('신고 실패', errorMessage(cause)) }
    finally { setReporting(false) }
  }

  async function analyzePhoto(uri: string) {
    if (!selected) return
    try {
      await uploadImageForAnalysis(API_BASE_URL, selected.id, uri)
      Alert.alert('사진 분석', '분석이 완료되었습니다.')
    } catch (cause) { Alert.alert('사진 분석 안내', errorMessage(cause)) }
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Text style={styles.brand}>Open Toilet</Text><Text style={styles.subtitle}>주변 개방화장실 찾기</Text></View>
    <View style={styles.tabs}><TabButton label="화장실 찾기" active={tab === 'search'} onPress={() => setTab('search')}/><TabButton label="내 제보" active={tab === 'reports'} onPress={() => void openReports()}/><TabButton label="계정" active={tab === 'account'} onPress={() => { setTab('account'); setError('') }}/></View>
    {tab === 'search' ? <View style={styles.body}>
      <View style={styles.searchRow}><TextInput style={styles.input} value={keyword} onChangeText={setKeyword} placeholder="화장실 이름 또는 주소" returnKeyType="search" onSubmitEditing={() => void search()}/><Pressable style={styles.primary} onPress={() => void search()}><Text style={styles.primaryText}>검색</Text></Pressable></View>
      <Pressable style={styles.locationButton} onPress={() => void nearby()}><Text style={styles.link}>현재 위치에서 주변 검색</Text></Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#1769c2" style={styles.loader}/> : null}
      {selected ? <ToiletDetailView detail={selected} busy={reporting} onBack={() => setSelected(null)} onNavigate={() => void openDirections(selected.latitude, selected.longitude, selected.name).catch((cause) => Alert.alert('길찾기 실행 실패', errorMessage(cause)))} onStatus={(data, uri) => void reportStatus(data, uri)} onIssue={(type, content, uri) => void reportIssue(type, content, uri)} onAnalyze={(uri) => void analyzePhoto(uri)}/> : <FlatList data={items} keyExtractor={(item) => String(item.id)} ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>검색 결과가 없습니다.</Text> : null} renderItem={({ item }) => <Pressable style={styles.card} onPress={() => void openDetail(item.id)}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.muted}>{item.address}</Text><Text style={styles.meta}>{item.distanceMeter == null ? '' : `${item.distanceMeter}m · `}{item.openTimeInfo || '운영시간 정보 없음'}</Text></Pressable>}/>}
      <Text style={styles.mapHint}>지도 API 키 없이 좌표와 목록 기반으로 검색합니다. 실제 지도 타일은 키 설정 후 연결할 수 있습니다.</Text>
    </View> : tab === 'reports' ? <View style={styles.body}>
      <Text style={styles.sectionTitle}>내 제보</Text><Text style={styles.muted}>현재 앱 실행 중 발급한 기기 ID 기준입니다. 앱을 재설치하거나 데이터를 초기화하면 ID가 달라질 수 있습니다.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}{loading ? <ActivityIndicator color="#1769c2" style={styles.loader}/> : null}
      <FlatList data={reports} keyExtractor={(item) => `${item.reportKind}-${item.id}`} ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>등록된 제보가 없습니다.</Text> : null} renderItem={({ item }) => <View style={styles.card}><Text style={styles.cardTitle}>{item.toilet.name} · {item.type}</Text><Text style={styles.muted}>{item.content}</Text><Text style={styles.meta}>{item.status || '접수 완료'} · {item.createdAt}</Text>{item.reviewMemo ? <Text style={styles.meta}>처리 메모: {item.reviewMemo}</Text> : null}</View>}/>
    </View> : <View style={styles.body}>
      <Text style={styles.sectionTitle}>계정</Text>
      {accountUser ? <View style={styles.card}><Text style={styles.cardTitle}>{accountUser.username}</Text><Text style={styles.muted}>로그인 계정에 연결된 제보만 내 제보 화면에 표시됩니다.</Text><Pressable disabled={accountBusy} style={styles.outlineWide} onPress={() => void signOut()}><Text style={styles.link}>{accountBusy ? '처리 중…' : '로그아웃'}</Text></Pressable></View> : <View style={styles.card}><Text style={styles.muted}>기존 익명 제보는 기기 ID 기준으로 계속 보존됩니다.</Text><TextInput style={styles.input} value={accountName} onChangeText={setAccountName} autoCapitalize="none" placeholder="아이디 (영문, 숫자, 밑줄)"/><TextInput style={styles.input} value={accountPassword} onChangeText={setAccountPassword} secureTextEntry placeholder={accountMode === 'register' ? '비밀번호 (10자 이상)' : '비밀번호'}/><Pressable disabled={accountBusy || accountName.length < 3 || accountPassword.length < (accountMode === 'register' ? 10 : 1)} style={styles.primaryWide} onPress={() => void submitAccount()}><Text style={styles.primaryText}>{accountBusy ? '처리 중…' : accountMode === 'login' ? '로그인' : '회원가입'}</Text></Pressable><Pressable onPress={() => setAccountMode(accountMode === 'login' ? 'register' : 'login')} style={styles.outlineWide}><Text style={styles.link}>{accountMode === 'login' ? '계정 만들기' : '로그인으로 전환'}</Text></Pressable></View>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>}
    <Text style={styles.footer}>API: {API_BASE_URL}</Text>
  </SafeAreaView>
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></Pressable> }

function ToiletDetailView({ detail, busy, onBack, onNavigate, onStatus, onIssue, onAnalyze }: { detail: ToiletDetail; busy: boolean; onBack: () => void; onNavigate: () => void; onStatus: (data: { hasTissue: boolean; hygieneStatus: HygieneStatus; isOpen: boolean; comment: string }, imageUri?: string) => void; onIssue: (type: IssueType, content: string, imageUri?: string) => void; onAnalyze: (uri: string) => void }) {
  const [tissue, setTissue] = useState<boolean | null>(null)
  const [hygiene, setHygiene] = useState<HygieneStatus | null>(null)
  const [open, setOpen] = useState<boolean | null>(null)
  const [issueType, setIssueType] = useState<IssueType>('OTHER')
  const [issueContent, setIssueContent] = useState('')
  const [cameraVisible, setCameraVisible] = useState(false)
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions()
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  async function openCamera() {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission()
      if (!permission.granted) { Alert.alert('카메라 권한 필요', '현장 사진을 촬영하려면 카메라 권한을 허용해 주세요.'); return }
    }
    setCameraVisible(true)
  }
  async function capture() {
    const image = await cameraRef.current?.takePictureAsync({ quality: 0.55, skipProcessing: true })
    if (image) { setPhoto(image); setCameraVisible(false) }
  }
  return <ScrollView style={styles.detail}>
    <Pressable onPress={onBack}><Text style={styles.link}>‹ 검색 결과</Text></Pressable><Text style={styles.sectionTitle}>{detail.name}</Text><Text style={styles.muted}>{detail.address}</Text>
    <View style={styles.card}><Text>운영시간: {detail.openTimeInfo || '정보 없음'}</Text><Text>현재 운영: {detail.isOpenNow ? '운영 중' : '확인 필요'}</Text><Text>장애인 화장실: {detail.hasDisabledToilet ? '있음' : '정보 없음'}</Text><Text>기저귀 교환대: {detail.hasDiaperTable ? '있음' : '정보 없음'}</Text><Text>휴지: {detail.hasTissue ? '있음' : '정보 없음'}</Text><Text>최근 제보: {detail.recentReports?.length ?? 0}건</Text></View>
    <Text style={styles.formLabel}>현장 상태 직접 확인</Text><ChoiceRow label="휴지" values={['있음', '없음']} onSelect={(value) => setTissue(value === '있음')}/><ChoiceRow label="위생" values={['청결', '보통', '불량']} onSelect={(value) => setHygiene(value === '청결' ? 'CLEAN' : value === '보통' ? 'NORMAL' : 'DIRTY')}/><ChoiceRow label="출입" values={['열림', '닫힘']} onSelect={(value) => setOpen(value === '열림')}/>
    <Pressable style={styles.outlineWide} onPress={onNavigate}><Text style={styles.link}>지도 앱에서 길찾기</Text></Pressable><Pressable disabled={busy || tissue === null || hygiene === null || open === null} style={styles.primaryWide} onPress={() => onStatus({ hasTissue: tissue!, hygieneStatus: hygiene!, isOpen: open!, comment: '모바일 앱 현장 확인' }, photo?.uri)}><Text style={styles.primaryText}>{busy ? '처리 중…' : photo ? '사진 포함 현장 제보' : '현장 상태 제보'}</Text></Pressable>
    <Text style={styles.formLabel}>현장 사진 분석 준비</Text><Pressable style={styles.outlineWide} onPress={() => void openCamera()}><Text style={styles.link}>카메라로 현장 사진 촬영</Text></Pressable>{photo && <><Image source={{ uri: photo.uri }} style={styles.photoPreview}/><Pressable style={styles.primaryWide} onPress={() => onAnalyze(photo.uri)}><Text style={styles.primaryText}>YOLOv8 분석 요청</Text></Pressable></>}
    <Text style={styles.formLabel}>오류 신고</Text><ChoiceRow label="유형" values={['운영·폐쇄', '위치 오류', '출입 정보', '기타']} onSelect={(value) => setIssueType(value === '운영·폐쇄' ? 'CLOSED' : value === '위치 오류' ? 'WRONG_LOCATION' : value === '출입 정보' ? 'WRONG_PASSWORD' : 'OTHER')}/><TextInput style={[styles.input, styles.issueInput]} value={issueContent} onChangeText={setIssueContent} placeholder="확인한 오류 내용을 입력하세요" multiline maxLength={500}/><Pressable disabled={busy || issueContent.trim().length === 0} style={styles.outlineWide} onPress={() => onIssue(issueType, issueContent.trim(), photo?.uri)}><Text style={styles.link}>{photo ? '사진 포함 오류 신고 접수' : '오류 신고 접수'}</Text></Pressable>
    <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => setCameraVisible(false)}><View style={styles.cameraModal}><Camera ref={cameraRef} style={styles.camera} type={CameraType.back}/><View style={styles.cameraActions}><Pressable style={styles.outlineWide} onPress={() => setCameraVisible(false)}><Text style={styles.link}>취소</Text></Pressable><Pressable style={styles.primaryWide} onPress={() => void capture()}><Text style={styles.primaryText}>촬영</Text></Pressable></View></View></Modal>
  </ScrollView>
}

function ChoiceRow({ label, values, onSelect }: { label: string; values: string[]; onSelect: (value: string) => void }) { const [choice, setChoice] = useState(''); return <View style={styles.choiceRow}><Text style={styles.choiceLabel}>{label}</Text><View style={styles.choiceOptions}>{values.map((value) => <Pressable key={value} onPress={() => { setChoice(value); onSelect(value) }} style={[styles.choice, choice === value && styles.choiceActive]}><Text style={choice === value ? styles.choiceActiveText : styles.muted}>{value}</Text></Pressable>)}</View></View> }

function errorMessage(error: unknown) { return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.' }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#f4f7fb' }, header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#e4eaf1' }, brand: { color: '#1769c2', fontSize: 22, fontWeight: '800' }, subtitle: { color: '#6b7787', marginTop: 3 }, tabs: { flexDirection: 'row', backgroundColor: '#fff' }, tab: { flex: 1, padding: 13, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' }, activeTab: { borderColor: '#1769c2' }, tabText: { color: '#64748b' }, activeTabText: { color: '#1769c2', fontWeight: '700' }, body: { flex: 1, padding: 16 }, searchRow: { flexDirection: 'row', gap: 8 }, input: { flex: 1, backgroundColor: '#fff', borderColor: '#d9e1ea', borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, minHeight: 46 }, primary: { backgroundColor: '#1769c2', paddingHorizontal: 16, borderRadius: 9, justifyContent: 'center' }, primaryText: { color: '#fff', fontWeight: '700' }, locationButton: { alignItems: 'flex-start', paddingVertical: 12 }, link: { color: '#1769c2', fontWeight: '700' }, card: { backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e1e8f0', gap: 5 }, cardTitle: { color: '#1d2b3a', fontSize: 16, fontWeight: '700' }, muted: { color: '#697789', lineHeight: 20 }, meta: { color: '#536273', fontSize: 12, marginTop: 4 }, error: { color: '#b42318', backgroundColor: '#fff0ee', padding: 10, borderRadius: 8, marginVertical: 8 }, empty: { textAlign: 'center', color: '#758296', padding: 30 }, loader: { marginVertical: 16 }, sectionTitle: { color: '#1d2b3a', fontSize: 21, fontWeight: '800', marginTop: 15, marginBottom: 8 }, detail: { flex: 1 }, formLabel: { color: '#25364a', fontWeight: '700', marginTop: 15, marginBottom: 5 }, choiceRow: { paddingVertical: 8, gap: 7 }, choiceLabel: { color: '#526276', fontSize: 12 }, choiceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { borderWidth: 1, borderColor: '#d8e1ec', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 18 }, choiceActive: { backgroundColor: '#eaf3ff', borderColor: '#1769c2' }, choiceActiveText: { color: '#1769c2', fontWeight: '700' }, issueInput: { minHeight: 80, textAlignVertical: 'top', marginTop: 7 }, primaryWide: { backgroundColor: '#1769c2', padding: 14, borderRadius: 9, alignItems: 'center', marginTop: 8 }, outlineWide: { borderColor: '#1769c2', borderWidth: 1, padding: 13, borderRadius: 9, alignItems: 'center', marginTop: 8 }, photoPreview: { width: '100%', height: 190, borderRadius: 10, marginTop: 10 }, cameraModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' }, camera: { flex: 1 }, cameraActions: { padding: 16, backgroundColor: '#fff' }, mapHint: { color: '#7c8795', fontSize: 11, paddingVertical: 10 }, footer: { fontSize: 10, color: '#8a96a5', paddingHorizontal: 12, paddingBottom: 4 } })
