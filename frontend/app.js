const $ = s => document.querySelector(s);
let userName = '';
let accessToken = '';
const API_BASE = 'http://127.0.0.1:8080/api/v1';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2000);
}
function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}
function openModal(inner) {
  const m = document.createElement('div');
  m.className = 'absolute inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-[1001]';
  m.innerHTML = `<div class="bg-white rounded-3xl w-full p-6 pop">${inner}</div>`;
  m.onclick = e => { if (e.target === m || e.target.closest('.close')) m.remove(); };
  $('.phone').appendChild(m);
  return m;
}
function openSheet(inner, top) {                  // 아래에서 올라오는 창 (top: 시작 높이)
  const dim = document.createElement('div');
  dim.className = 'absolute inset-0 bg-slate-900/50 z-[999]';
  const s = document.createElement('div');
  s.className = 'sheet';
  if (top) s.style.top = top;
  s.innerHTML = inner;
  const close = () => { dim.remove(); s.remove(); };
  dim.onclick = close;
  s.onclick = e => { if (e.target.closest('.close')) close(); };
  $('.phone').append(dim, s);
  return { el: s, close };
}

// ═════════════════ 랜드마크 · 뱃지 ═════════════════
// 뱃지 이미지: hacker26/character_image/<id>.png
// 파일 이름이 id와 다르면 해당 줄에 badge: '경로' 를 따로 적음
const BADGE_DIR = 'character_image/';
const BADGE_EXT = '.png';
const GEOFENCE_M = 150;

const LANDMARKS = [
  // 강남구
  { id: 'gangnam',     name: '강남',         region: '강남구',   lat: 37.4979, lng: 127.0276, desc: '서울의 대표 번화가' },
  { id: 'coex',        name: '코엑스',       region: '강남구',   lat: 37.5116, lng: 127.0595, desc: '대형 전시장과 별마당 도서관' },
  { id: 'bongeunsa',   name: '봉은사',       region: '강남구',   lat: 37.5150, lng: 127.0573, desc: '도심 속 천년 고찰' },
  // 중구
  { id: 'namsan',      name: '남산',         region: '중구',     lat: 37.5512, lng: 126.9882, desc: 'N서울타워와 서울 전경' },
  { id: 'myeongdong',  name: '명동',         region: '중구',     lat: 37.5636, lng: 126.9827, desc: '쇼핑과 길거리 음식' },
  { id: 'deoksugung',  name: '덕수궁',       region: '중구',     lat: 37.5658, lng: 126.9751, desc: '돌담길이 아름다운 궁' },
  // 서대문구
  { id: 'dongnipmun',  name: '독립문',       region: '서대문구', lat: 37.5722, lng: 126.9599, desc: '자주독립 의지를 담은 문', badge: 'character_image/doklibmun.png' },
  { id: 'seodaemun',   name: '서대문형무소', region: '서대문구', lat: 37.5743, lng: 126.9561, desc: '독립운동의 역사 현장' },
  { id: 'sinchon',     name: '신촌',         region: '서대문구', lat: 37.5551, lng: 126.9368, desc: '대학가 문화의 거리' },
  // 종로구
  { id: 'gwanghwamun', name: '광화문',       region: '종로구',   lat: 37.5725, lng: 126.9769, desc: '세종대왕상과 이순신 장군상', badge: 'character_image/gangwha.png' },
  { id: 'gyeongbok',   name: '경복궁',       region: '종로구',   lat: 37.5796, lng: 126.9770, desc: '조선 왕조의 법궁', badge: 'character_image/bokoong.png' },
  { id: 'bukchon',     name: '북촌',         region: '종로구',   lat: 37.5826, lng: 126.9831, desc: '전통 한옥 마을' },
];
// 획득한 뱃지 (가데이터 – 백엔드 연결 시 서버 값으로 교체)
// 시연용: 강남·광화문은 처음엔 없음 → 미션 성공하면 획득 (새로고침하면 처음 상태로)
//        광화문 미션 성공 시 종로구(광화문·경복궁·북촌) 완성 → 쿠폰 받기 가능
const GOT = new Set(['namsan', 'dongnipmun', 'gyeongbok', 'bukchon']);

const badgeSrc = l => l.badge || `${BADGE_DIR}${l.id}${BADGE_EXT}`;
// 뱃지 이미지 태그. 파일이 아직 없으면 빈 칸(또는 fallback 글자)으로 표시
function badgeImg(l, fallback = '') {
  return `<img src="${badgeSrc(l)}" alt="${l.name} 뱃지" data-fb="${fallback}"
               onerror="this.replaceWith(document.createTextNode(this.dataset.fb))">`;
}

// ═════════════════ 지도 ═════════════════
let myPos = store('myPos') || [37.5725, 126.9769];   // 기본: 광화문
let leafletMap = null, leafletReady = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = resolve; js.onerror = reject;
    document.head.appendChild(js);
  });
  return leafletReady;
}
function distance(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dp = r(b[0] - a[0]), dl = r(b[1] - a[1]);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = m => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

let meMarker = null;

// 지도 탭: 화면 전체 지도 + 핀 누르면 아래 카드
function renderMap() {
  return `
  <div class="relative h-full">
    <div id="leaflet" class="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 text-sm" style="border-radius:0">지도 불러오는 중…</div>
    <button id="gpsBtn" class="absolute top-3 right-3 z-[500] bg-white rounded-full px-3 py-2 text-xs font-bold shadow">📍 내 위치</button>
    <div id="pinCard" class="hidden absolute left-3 right-3 bottom-3 z-[600]"></div>
  </div>`;
}
function showPinCard(l) {
  const card = $('#pinCard');
  if (!card) return;
  const d = distance(myPos, [l.lat, l.lng]), near = d <= GEOFENCE_M, got = GOT.has(l.id);
  card.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl p-4 rise">
      <div class="flex items-center gap-3">
        <div class="badge-circle ${got ? 'on' : 'off'} !w-14 !h-14 shrink-0">${badgeImg(l, got ? '' : '?')}</div>
        <div class="flex-1 min-w-0">
          <p class="font-black text-slate-800">${l.name} <span class="text-xs text-slate-400 font-normal">${l.region}</span></p>
          <p class="text-xs text-slate-500 truncate">${l.desc}</p>
          <div class="flex gap-1.5 mt-1.5">
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${near ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">${near ? '미션 가능' : fmtDist(d)}</span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${got ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}">${got ? '획득 완료' : '미획득'}</span>
          </div>
        </div>
        <button class="pin-close w-8 h-8 rounded-full bg-slate-100 text-slate-500 shrink-0" aria-label="닫기">✕</button>
      </div>
      ${near
        ? `<button class="pin-info mt-3 w-full bg-blue-700 text-white rounded-xl py-3 font-bold">지역 정보</button>`
        : `<button class="pin-move mt-3 w-full bg-slate-800 text-white rounded-xl py-3 font-medium">이 장소로 이동</button>`}
    </div>`;
  card.classList.remove('hidden');
  card.querySelector('.pin-close').onclick = () => card.classList.add('hidden');
  card.querySelector('.pin-info')?.addEventListener('click', () => { currentLandmark = l; go('landmark'); });
  card.querySelector('.pin-move')?.addEventListener('click', () => {
    myPos = [l.lat - 0.0004, l.lng];
    store('myPos', myPos);
    meMarker?.setLatLng(myPos);
    leafletMap?.setView([l.lat, l.lng], 16);
    toast(`${l.name} 앞으로 이동했어요`);
    showPinCard(l);
  });
}
async function bindMap() {
  $('#gpsBtn').onclick = () => navigator.geolocation.getCurrentPosition(
    p => {
      myPos = [p.coords.latitude, p.coords.longitude]; store('myPos', myPos);
      meMarker?.setLatLng(myPos); leafletMap?.setView(myPos, 16);
      toast('현재 위치를 불러왔어요');
    },
    () => toast('위치 권한을 허용해 주세요'));

  try { await loadLeaflet(); } catch { $('#leaflet').textContent = '지도를 불러오지 못했어요'; return; }
  if (!$('#leaflet')) return;
  $('#leaflet').innerHTML = '';
  leafletMap = L.map('leaflet', { zoomControl: false });
  leafletMap.attributionControl.setPrefix(false);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(leafletMap);
  // 처음엔 모든 랜드마크가 한눈에 보이게
  leafletMap.fitBounds(L.latLngBounds(LANDMARKS.map(l => [l.lat, l.lng]).concat([myPos])), { padding: [40, 40] });
  LANDMARKS.forEach(l => {
    const got = GOT.has(l.id);
    L.circle([l.lat, l.lng], { radius: GEOFENCE_M, color: '#1d4ed8', weight: 1, fillOpacity: .08 }).addTo(leafletMap);
    L.marker([l.lat, l.lng], {
      icon: L.divIcon({ html: `<div class="map-pin ${got ? 'got' : 'lock'}">${badgeImg(l, got ? '' : '?')}</div>`, className: '', iconSize: [38, 38], iconAnchor: [19, 19] }),
    }).addTo(leafletMap).on('click', () => { leafletMap.panTo([l.lat, l.lng]); showPinCard(l); });
  });
  meMarker = L.circleMarker(myPos, { radius: 8, color: '#fff', weight: 3, fillColor: '#ef4444', fillOpacity: 1 })
    .addTo(leafletMap).bindTooltip('내 위치');
  leafletMap.on('click', () => $('#pinCard')?.classList.add('hidden'));   // 빈 곳 누르면 카드 닫기
}

// ═════════════════ 지역 정보 (해치 안내 + 채팅) ═════════════════
const GUIDE_IMG = 'character_image/hachi.png';

function landmarkGuideUrl(landmark) {
  return API_BASE + '/landmarks/' + encodeURIComponent(landmark.id);
}
// 말풍선에 들어갈 장소 소개
const LANDMARK_INFO = {
  gangnam:     '강남역과 테헤란로를 중심으로 한 서울의 대표 번화가야. 쇼핑, 맛집, K-POP 문화를 한 번에 즐길 수 있어!',
  coex:        '별마당 도서관과 아쿠아리움이 있는 대형 복합 공간이야. 거대한 책장 앞에서 사진 찍는 게 인기야!',
  bongeunsa:   '코엑스 바로 옆, 도심 한가운데 있는 오래된 절이야. 빌딩 숲과 고즈넉한 사찰이 함께 보이는 풍경이 멋져!',
  namsan:      '서울 한가운데 있는 산이야. 꼭대기의 N서울타워에서 서울 전체를 내려다볼 수 있고, 한양도성 성곽길도 걸을 수 있어!',
  myeongdong:  '쇼핑과 길거리 음식으로 유명한 거리야. 근처에 명동성당도 있어서 함께 둘러보기 좋아!',
  deoksugung:  '대한제국의 황궁이었던 곳이야. 궁 옆 돌담길은 서울에서 가장 아름다운 산책길로 꼽혀!',
  dongnipmun:  '1897년 독립협회가 자주독립의 뜻을 담아 세운 문이야. 지금은 서대문독립공원 안에 있어!',
  seodaemun:   '일제강점기에 많은 독립운동가가 갇혔던 감옥이야. 지금은 그 역사를 기억하는 역사관으로 바뀌었어.',
  sinchon:     '대학가가 모여 있는 젊음의 거리야. 카페, 공연, 맛집이 가득해!',
  gwanghwamun: '경복궁의 정문이야. 앞 광장에는 세종대왕상과 이순신 장군상이 있어서 사진 명소로 유명해!',
  gyeongbok:   '1395년에 지어진 조선의 첫 번째 궁궐이야. 근정전과 경회루가 꼭 봐야 할 곳이야!',
  bukchon:     '경복궁과 창덕궁 사이에 한옥이 모여 있는 마을이야. 골목마다 전통 풍경이 살아 있어!',
};
let currentLandmark = null;

function renderLandmark() {
  const l = currentLandmark;
  if (!l) return '';
  return `
  <div class="landmark-guide rise">
    <!-- 상단: 뒤로가기 + 장소 이름 -->
    <div class="flex items-center gap-3 px-4 pt-3 pb-2">
      <button id="lmBack" class="w-9 h-9 rounded-full bg-white shadow-sm text-slate-600" aria-label="지도로 돌아가기">←</button>
      <div>
        <p class="font-black text-slate-800 leading-tight">${l.name}</p>
        <p class="text-[11px] text-slate-400">${l.region}</p>
      </div>
    </div>

    <!-- 해치(왼쪽) + 말풍선(오른쪽) : 크게 -->
    <div class="landmark-intro">
      <img src="${GUIDE_IMG}" alt="해치" class="landmark-intro-avatar object-contain shrink-0 float" onerror="this.style.visibility='hidden'">
      <div class="bubble flex-1 bg-white rounded-2xl p-3 shadow-sm text-sm leading-relaxed text-slate-700">
        <p id="landmarkGreeting" class="text-[17px] font-black text-slate-800 mb-1.5">${l.name}에 온 걸 환영해!</p>
        <p id="landmarkDescription">${LANDMARK_INFO[l.id] || l.desc}</p>
        <a id="landmarkSource" hidden class="mt-1 text-xs text-blue-700 underline"
           target="_blank" rel="noopener noreferrer">${lang === 'en' ? 'Official tourism source' : '공식 관광 자료'}</a>
        <span id="landmarkSpeech"></span>
      </div>
    </div>

    <!-- 채팅 -->
    <div class="guide-chat bg-white rounded-2xl shadow-sm">
      <div id="chatLog" class="guide-chat-log" role="log" aria-label="해치 대화">
      </div>
      <form id="chatForm" class="flex gap-2 p-2 border-t border-slate-100">
        <input id="chatInput" maxlength="500" class="min-w-0 flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none" placeholder="이 장소에 대해 물어보세요" autocomplete="off">
        <button type="submit" class="bg-blue-700 text-white rounded-full px-4 text-sm font-bold disabled:opacity-50">전송</button>
      </form>
    </div>

    <!-- 미션 시작 -->
    <div class="p-4">
      <button id="missionStart" class="w-full bg-blue-700 text-white rounded-xl py-3.5 font-bold">미션 시작</button>
    </div>
  </div>`;
}
async function authenticatedRequest(url, options = {}) {
  const token = accessToken;
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (response.status === 401 && accessToken === token) {
    showLogin();
    $('#loginError').textContent = lang === 'en' ? 'Please sign in again.' : '다시 로그인해 주세요.';
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new Error(body?.error?.code || body?.code || 'API_REQUEST_FAILED');
  }
  return body.data;
}

async function loadLandmarkDescription(landmark) {
  const description = $('#landmarkDescription');
  const greeting = $('#landmarkGreeting');
  const source = $('#landmarkSource');
  try {
    const data = await authenticatedRequest(landmarkGuideUrl(landmark), { headers: { 'Accept-Language': lang } });
    if (!description.isConnected) return;
    greeting.textContent = data.characterComment;
    description.textContent = data.description;
    source.href = data.sourceRef;
    source.hidden = false;
  } catch {
    // The local description remains visible when the guide server is unavailable.
  }
}

async function askGuide(landmark, question) {
  const data = await authenticatedRequest(landmarkGuideUrl(landmark) + '/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language: lang }),
  });
  return data;
}

let activeGuideSpeech = null;

function stopGuideSpeech() {
  if (!activeGuideSpeech) return;
  activeGuideSpeech.button.setAttribute('aria-pressed', 'false');
  activeGuideSpeech = null;
  window.speechSynthesis.cancel();
}

function guideSpeechButton(readText) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'guide-speech';
  button.textContent = '🔊';
  const label = lang === 'en' ? 'Read aloud' : '읽어주기';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', 'false');
  button.onclick = () => {
    const wasPlaying = activeGuideSpeech?.button === button;
    stopGuideSpeech();
    if (wasPlaying) return;

    const utterance = new window.SpeechSynthesisUtterance(readText());
    utterance.lang = lang === 'en' ? 'en-US' : 'ko-KR';
    const finish = () => {
      if (activeGuideSpeech?.utterance !== utterance) return;
      button.setAttribute('aria-pressed', 'false');
      activeGuideSpeech = null;
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeGuideSpeech = { utterance, button };
    button.setAttribute('aria-pressed', 'true');
    window.speechSynthesis.speak(utterance);
  };
  return button;
}

function guideSource(url, title) {
  try {
    const address = new URL(url);
    if (!['http:', 'https:'].includes(address.protocol) || address.username || address.password) return null;
    const link = document.createElement('a');
    link.href = address.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'guide-citation';
    link.textContent = lang === 'en' ? 'Source' : '출처';
    if (title) link.title = title;
    return link;
  } catch {
    return null;
  }
}

function addChat(text, who, { citations = [], sourceRef, readAloud = false } = {}) {
  const log = $('#chatLog');
  const message = document.createElement('div');
  message.className = `chat-msg ${who}`;
  if (who === 'bot') {
    const label = document.createElement('span');
    label.className = 'guide-speaker';
    label.textContent = lang === 'en' ? 'Haechi' : '해치';
    message.append(label);
  }

  const body = document.createElement('div');
  let offset = 0;
  const ordered = [...citations].sort((a, b) => a.endIndex - b.endIndex);
  for (const citation of ordered) {
    const end = citation.endIndex;
    if (!Number.isInteger(end) || end < offset || end > text.length) continue;
    const link = guideSource(citation.url, citation.title);
    if (!link) continue;
    body.append(text.slice(offset, end), link);
    offset = end;
  }
  body.append(text.slice(offset));
  if (sourceRef) {
    const source = guideSource(sourceRef);
    if (source) {
      source.textContent = lang === 'en' ? 'Official guide' : '공식 안내';
      body.append(source);
    }
  }
  message.append(body);
  const speech = readAloud ? guideSpeechButton(() => text) : null;
  if (speech) message.append(speech);
  log.append(message);
  log.scrollTop = log.scrollHeight;
  return message;
}

function bindLandmark() {
  const landmark = currentLandmark;
  const form = $('#chatForm');
  const input = $('#chatInput');
  const send = form.querySelector('button');
  $('#lmBack').onclick = () => go('map');
  $('#missionStart').onclick = () => {
    stopGuideSpeech();
    startMission(landmark);
  };
  const introSpeech = guideSpeechButton(() =>
    $('#landmarkGreeting').textContent + ' ' + $('#landmarkDescription').textContent);
  if (introSpeech) $('#landmarkSpeech').append(introSpeech);
  addChat(lang === 'en' ? 'Ask me anything about this place!' : '궁금한 게 있으면 뭐든 물어봐!', 'bot');
  void loadLandmarkDescription(landmark);

  async function submitQuestion(question, retryMessage) {
    if (!form.isConnected || send.disabled) return;
    if (retryMessage) retryMessage.remove();
    else addChat(question, 'me');
    send.disabled = true;
    const pending = addChat(lang === 'en' ? 'Haechi is preparing an answer…' : '해치가 답변을 준비 중이에요…', 'bot');

    try {
      const data = await askGuide(landmark, question);
      if (form.isConnected) {
        pending.remove();
        addChat(data.answer, 'bot', {
          citations: data.citations,
          sourceRef: data.status === 'NO_SOURCE' ? data.sourceRef : null,
          readAloud: true,
        });
      }
    } catch (error) {
      if (!form.isConnected || error.message === 'UNAUTHORIZED') return;
      pending.remove();
      const unavailable = error.message === 'GUIDE_NOT_CONFIGURED';
      const message = unavailable
        ? (lang === 'en' ? 'The guide server needs its AI settings.' : '서버에 AI 가이드 설정이 필요해요.')
        : (lang === 'en' ? 'The guide could not answer. Please try again.' : '답변을 가져오지 못했어요. 다시 시도해 주세요.');
      const failed = addChat(message, 'bot');
      if (!unavailable) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'guide-retry';
        retry.textContent = lang === 'en' ? 'Try again' : '다시 시도';
        retry.onclick = () => void submitQuestion(question, failed);
        failed.append(retry);
        $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
      }
    } finally {
      pending.remove();
      send.disabled = false;
    }
  }

  form.onsubmit = e => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question || send.disabled) return;
    input.value = '';
    void submitQuestion(question);
  };
}

// ═════════════════ 미션 (시연: 강남 = 사진, 광화문 = 음성) ═════════════════
const MISSIONS = {
  gangnam: {
    id: 901,
    type: 'photo',
    example: 'character_image/gangnam_pose.png',      // 예시 포즈 사진 (파일 넣으면 자동 표시)
    guides: ['팔과 상체가 잘 보이게 찍어주세요', '예시 사진과 같은 포즈를 취해주세요', '앱 카메라로만 촬영할 수 있어요'],
  },
  gwanghwamun: {
    id: 102,
    type: 'voice',
    line:  '신에게는 아직 열두 척의 배가 남아 있사옵니다',
    roman: 'Sinegeneun ajik yeoldu cheogui baega nama itsaomnida',
  },
};
const PASS_SCORE = 80;   // 음성 미션 성공 기준 (%)

function startMission(l) {
  if (!MISSIONS[l.id]) return toast('이 장소의 미션은 준비 중이에요');
  currentLandmark = l;
  go('mission');
}

function renderMission() {
  const l = currentLandmark, m = MISSIONS[l.id];
  const head = `
    <div class="flex items-center gap-3 px-4 pt-3 pb-2">
      <button id="msBack" class="w-9 h-9 rounded-full bg-white shadow-sm text-slate-600" aria-label="뒤로">←</button>
      <p class="font-black text-slate-800">${m.type === 'photo' ? '사진 미션' : '음성 미션'}</p>
      <span class="ml-auto text-xs text-slate-400">${l.name}</span>
    </div>`;
  if (m.type === 'photo') return `
  <div class="h-full flex flex-col rise">
    ${head}
    <div class="flex-1 min-h-0 overflow-y-auto px-5 space-y-4">
      <div>
        <p class="text-[11px] font-bold tracking-widest text-blue-700">MISSION · PHOTO</p>
        <p class="text-xl font-black text-slate-800 leading-snug mt-1">사진과 같은 포즈로<br>인증샷을 찍어보세요!</p>
      </div>
      <div class="example-box">
        <img src="${m.example}" alt="예시 포즈" onerror="this.remove()">
        <span>예시 포즈 사진</span>
      </div>
      <ul class="bg-white rounded-2xl p-4 shadow-sm space-y-1.5 text-[13px] text-slate-600">
        ${m.guides.map(g => `<li class="flex gap-2"><span class="text-blue-700">✓</span><span>${g}</span></li>`).join('')}
      </ul>
    </div>
    <div class="p-4"><button id="shootStart" class="w-full bg-blue-700 text-white rounded-xl py-3.5 font-bold">📷 촬영 시작</button></div>
  </div>`;
  return `
  <div class="h-full flex flex-col rise">
    ${head}
    <div class="flex-1 min-h-0 overflow-y-auto px-5 space-y-4">
      <div>
        <p class="text-[11px] font-bold tracking-widest text-blue-700">MISSION · VOICE</p>
        <p class="text-xl font-black text-slate-800 leading-snug mt-1">아래 문장을 소리 내어<br>따라 읽어보세요!</p>
      </div>
      <div class="bg-white rounded-3xl p-5 shadow-sm text-center space-y-3">
        <p class="text-[22px] font-black text-slate-800 leading-snug" lang="ko">${m.line}</p>
        <div class="border-t border-dashed border-slate-200"></div>
        <p class="text-[15px] text-slate-500 italic" lang="en">${m.roman}</p>
      </div>
      <p class="text-center text-xs text-slate-400">문장 일치도 ${PASS_SCORE}% 이상이면 성공!</p>
    </div>
    <div class="flex flex-col items-center gap-2 pb-6 pt-2">
      <button id="micBtn" class="mic-btn" aria-label="녹음 시작">🎙️</button>
      <p id="micLabel" class="text-sm font-bold text-slate-600">눌러서 녹음 시작</p>
    </div>
  </div>`;
}
function bindMission() {
  $('#msBack').onclick = () => go('landmark');
  const landmark = currentLandmark;
  const mission = MISSIONS[landmark.id];
  if (mission.type === 'photo') $('#shootStart').onclick = () => openCamera(landmark, mission);
  else $('#micBtn').onclick = () => toggleRecord(landmark, mission);
}

async function submitMission(mission, file, filename, isCurrent) {
  const token = accessToken;
  if (!file?.size) throw new Error('EMPTY_MISSION_FILE');
  const form = new FormData();
  form.append(mission.type === 'photo' ? 'image' : 'audio', file, filename);

  const { gpsRequired } = await authenticatedRequest(API_BASE + '/missions/location-settings');
  if (!isCurrent() || accessToken !== token) return null;
  if (gpsRequired) {
    if (!store('locationAgreed')) {
      askLocationConsent();
      throw new Error('MISSION_LOCATION_CONSENT_REQUIRED');
    }
    if (!navigator.geolocation) throw new Error('MISSION_LOCATION_UNAVAILABLE');
    const { coords } = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('MISSION_LOCATION_UNAVAILABLE')),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    });
    form.append('latitude', String(coords.latitude));
    form.append('longitude', String(coords.longitude));
  }

  if (!isCurrent() || accessToken !== token) return null;
  return authenticatedRequest(`${API_BASE}/missions/${mission.id}/${mission.type}`, {
    method: 'POST',
    headers: { 'Accept-Language': lang },
    body: form,
  });
}

function missionError(error) {
  const messages = {
    MISSION_LOCATION_CONSENT_REQUIRED: '위치 이용에 동의한 뒤 다시 시도해 주세요.',
    MISSION_LOCATION_UNAVAILABLE: '브라우저 위치 권한과 위치 설정을 확인해 주세요.',
    INVALID_LOCATION: '현재 위치를 확인한 뒤 다시 시도해 주세요.',
    MISSION_LOCATION_NOT_CONFIGURED: '서버에 미션 기준 위치가 설정되지 않았어요.',
    EMPTY_MISSION_FILE: '촬영 또는 녹음 파일이 비어 있어요. 다시 시도해 주세요.',
    UNSUPPORTED_MEDIA_TYPE: '서버에서 지원하지 않는 파일 형식이에요.',
    FILE_TOO_LARGE: '파일이 너무 커요. 다시 촬영하거나 짧게 녹음해 주세요.',
    MISSION_NOT_FOUND: '서버에서 미션을 찾지 못했어요.',
  };
  if (error.message !== 'UNAUTHORIZED') {
    toast(messages[error.message] || '미션을 확인하지 못했어요. 다시 시도해 주세요.');
  }
}

// ── 사진 미션: 카메라 ──
let camStream = null;
let cameraOverlay = null;
function stopCam() {
  camStream?.getTracks().forEach(track => track.stop());
  camStream = null;
  cameraOverlay?.remove();
  cameraOverlay = null;
}
async function openCamera(landmark, mission) {
  const start = $('#shootStart');
  if (!start || start.disabled) return;
  start.disabled = true;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch {
    if (start.isConnected) toast('카메라 권한을 확인해 주세요.');
    start.disabled = false;
    return;
  }
  if (!start.isConnected || !accessToken) {
    stream.getTracks().forEach(track => track.stop());
    return;
  }
  camStream = stream;
  const cam = document.createElement('div');
  cameraOverlay = cam;
  cam.className = 'absolute inset-0 z-[1100] bg-black flex flex-col';
  cam.innerHTML = `
    <div class="flex items-center justify-between px-5 pt-10 pb-3 text-white">
      <button class="cam-cancel text-sm">취소</button>
      <span class="text-sm font-bold">사진 미션 촬영</span>
      <span class="w-8"></span>
    </div>
    <div class="relative flex-1 mx-3 rounded-3xl overflow-hidden bg-slate-800">
      <video class="absolute inset-0 w-full h-full object-cover" autoplay playsinline muted></video>
      <div class="cam-ref">
        <img src="${mission.example}" alt="" onerror="this.remove()">
        <span>예시 포즈</span>
      </div>
    </div>
    <div class="flex items-center justify-center py-8">
      <button class="cam-shot w-[76px] h-[76px] rounded-full bg-white border-[6px] border-slate-500" aria-label="촬영"></button>
    </div>`;
  $('.phone').appendChild(cam);
  const video = cam.querySelector('video');
  video.srcObject = stream;
  cam.querySelector('.cam-cancel').onclick = () => { stopCam(); start.disabled = false; };
  const shot = cam.querySelector('.cam-shot');
  shot.onclick = async () => {
    if (!video.videoWidth || !video.videoHeight) return toast('카메라 준비 후 다시 눌러 주세요.');
    shot.disabled = true;
    let wait;
    try {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * ratio);
      canvas.height = Math.round(video.videoHeight * ratio);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .85));
      if (cameraOverlay !== cam) return;
      stopCam();
      wait = openModal('<div class="text-center py-6 font-bold">AI가 사진을 확인하고 있어요…</div>');
      const result = await submitMission(mission, photo, 'mission.jpg', () => start.isConnected);
      if (result && start.isConnected && accessToken) {
        showMissionResult(landmark, mission, result, () => openCamera(landmark, mission));
      }
    } catch (error) {
      if (start.isConnected) missionError(error);
    } finally {
      if (cameraOverlay === cam) stopCam();
      wait?.remove();
      if (!cameraOverlay) start.disabled = false;
    }
  };
}

// ── 음성 미션: 녹음 ──
let activeRecording = null;
function cancelMissionRecording() {
  if (!activeRecording) return;
  const recording = activeRecording;
  activeRecording = null;
  if (recording.media.state !== 'inactive') recording.media.stop();
  recording.stream.getTracks().forEach(track => track.stop());
}

async function toggleRecord(landmark, mission) {
  const button = $('#micBtn');
  if (!button || button.disabled) return;
  const label = $('#micLabel');
  if (activeRecording) {
    button.disabled = true;
    activeRecording.media.stop();
    return;
  }
  const format = [
    { mimeType: 'audio/webm', filename: 'mission.webm' },
    { mimeType: 'audio/mp4', filename: 'mission.m4a' },
  ].find(({ mimeType }) => window.MediaRecorder?.isTypeSupported(mimeType));
  if (!format) return toast('이 브라우저에서는 지원되는 형식으로 녹음할 수 없어요.');

  button.disabled = true;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!button.isConnected || !accessToken) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    const media = new MediaRecorder(stream, { mimeType: format.mimeType });
    const recording = { media, stream };
    const chunks = [];
    const reset = () => {
      button.classList.remove('rec');
      button.disabled = false;
      label.textContent = '눌러서 녹음 시작';
    };
    media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    media.onerror = () => {
      if (activeRecording !== recording) return;
      cancelMissionRecording();
      reset();
      toast('녹음 중 오류가 발생했어요. 다시 시도해 주세요.');
    };
    media.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      if (activeRecording !== recording) return;
      activeRecording = null;
      if (!button.isConnected || !accessToken) return;
      button.classList.remove('rec');
      label.textContent = '분석 중…';
      try {
        const audio = new Blob(chunks, { type: media.mimeType || format.mimeType });
        const result = await submitMission(mission, audio, format.filename, () => button.isConnected);
        if (result && button.isConnected && accessToken) {
          showMissionResult(landmark, mission, result, () => toggleRecord(landmark, mission));
        }
      } catch (error) {
        if (button.isConnected) missionError(error);
      } finally {
        reset();
      }
    };
    media.start();
    activeRecording = recording;
    button.classList.add('rec');
    label.textContent = '녹음 중… 다 읽으면 다시 누르세요';
  } catch {
    stream?.getTracks().forEach(track => track.stop());
    if (button.isConnected) toast('마이크 권한과 연결을 확인해 주세요.');
  } finally {
    button.disabled = false;
  }
}

// ── 결과 팝업 ──
function showMissionResult(landmark, mission, result, retry) {
  const passed = result.result === 'PASSED';
  const photo = mission.type === 'photo';
  const score = photo ? result.poseScore : result.accuracyScore;
  const feedback = photo ? result.feedback : result.feedback?.summary;
  if (passed) GOT.add(landmark.id);
  const scoreRing = Number.isFinite(score) ? `
    <p class="text-xs font-bold text-slate-500 mb-2">${photo ? '포즈 점수' : '문장 일치도'}</p>
    <div class="score-ring ${passed ? 'ok' : 'ng'}"><span>${score}%</span></div>` : '';
  const m = openModal(`
    <div class="text-center">
      <p class="text-xs font-semibold text-slate-500 mb-2">${lang === 'en' ? 'Server result' : '서버 판정 결과'}</p>
      ${scoreRing}
      <p class="text-3xl font-black ${passed ? 'text-blue-700' : 'text-slate-700'} mt-2">${passed ? '미션 성공!' : '미션 실패'}</p>
      <p class="mission-feedback text-sm text-slate-500 mt-2"></p>
      <p class="mission-transcript text-xs text-slate-500 mt-2" hidden></p>
      ${passed ? `
        <div class="mt-4 flex flex-col items-center gap-2">
          <div class="badge-circle on !w-20 !h-20 badge-pop">${badgeImg(landmark, '')}</div>
          <p class="font-bold text-slate-800">${landmark.name} 뱃지를 획득했어요!</p>
        </div>
        <button class="go-col mt-4 w-full bg-blue-700 text-white rounded-xl py-3 font-bold">컬렉션 보기</button>` : ''}
      ${!passed && result.retryAvailable ? `
        <button class="retry mt-4 w-full bg-blue-700 text-white rounded-xl py-3 font-bold">${photo ? '다시 촬영하기' : '다시 녹음하기'}</button>` : ''}
      <button class="close mt-2 w-full text-slate-500 py-2 text-sm">닫기</button>
    </div>`);
  m.querySelector('.mission-feedback').textContent = feedback || '';
  if (!photo && result.recognizedText) {
    const transcript = m.querySelector('.mission-transcript');
    transcript.textContent = (lang === 'en' ? 'Recognized: ' : '인식한 문장: ') + result.recognizedText;
    transcript.hidden = false;
  }
  m.querySelector('.go-col')?.addEventListener('click', () => { m.remove(); go('collection'); });
  m.querySelector('.retry')?.addEventListener('click', () => { m.remove(); retry(); });
}

// ═════════════════ 스킨 (캐릭터) ═════════════════
// 이미지: hacker26/character_image/<id>.png
const SKIN_DIR = 'character_image/';
const SKIN_EXT = '.png';
const CHARACTERS = [
  { key: 'baek',   name: '백호' },
  { key: 'cheong', name: '청룡' },
  { key: 'hyun',   name: '현무' },
  { key: 'jujak',  name: '주작' },
];
// 스킨 이름 (따로 정하지 않으면 1번은 '백호', 나머지는 '백호 2' 처럼 표시)
const SKIN_NAMES = {
  baek1: '백호',
  baek2: '서민 백호',
  baek3: '양반 백호',
  baek4: '왕 백호',
};
const SKINS = CHARACTERS.flatMap(c => [1, 2, 3, 4].map(n => {
  const id = `${c.key}${n}`;
  return { id, char: c.key, name: SKIN_NAMES[id] || (n === 1 ? c.name : `${c.name} ${n}`) };
}));
// 처음부터 열려 있는 스킨
const BASE_UNLOCKED = ['baek1', 'baek2', 'baek3', 'cheong1', 'hyun1', 'jujak1'];
// 컬렉션 한 줄(쿠폰) 받을 때마다 이 순서대로 하나씩 해금 (첫 보상: 왕 백호)
const REWARD_ORDER = ['baek4', 'cheong2', 'hyun2', 'jujak2',
                      'cheong3', 'hyun3', 'jujak3',
                      'cheong4', 'hyun4', 'jujak4'];

const skinSrc = id => `${SKIN_DIR}${id}${SKIN_EXT}`;
const findSkin = id => SKINS.find(s => s.id === id);
// 해금된 스킨 = 기본 스킨 + 받은 쿠폰 수만큼의 보상 스킨
function unlockedSkins() { return BASE_UNLOCKED.concat(REWARD_ORDER.slice(0, coupons.length)); }
let equippedSkin = store('equippedSkin') || BASE_UNLOCKED[0];

// 캐릭터 그리기 (홈 화면)
function character(size) {
  if (!unlockedSkins().includes(equippedSkin)) equippedSkin = BASE_UNLOCKED[0];
  return `
    <div class="char-stage" style="width:${size}px;height:${size}px">
      <div class="char-body float">
        <img class="base" src="${skinSrc(equippedSkin)}" alt="${findSkin(equippedSkin).name}"
             onerror="this.outerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-slate-400 text-sm&quot;>${equippedSkin}.png 없음</div>'" />
      </div>
    </div>`;
}

function skinSheetHTML() {
  const open = unlockedSkins();
  return `
    <div class="flex items-center justify-between px-6 pt-5 pb-3">
      <div>
        <p class="text-xl font-black text-slate-800">스킨</p>
        <p class="text-xs text-slate-500">해금 ${open.length} / ${SKINS.length}</p>
      </div>
      <button class="close w-10 h-10 rounded-full bg-slate-200 text-slate-600 text-lg" aria-label="닫기">✕</button>
    </div>
    <div class="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
      ${CHARACTERS.map(c => `
        <div>
          <p class="text-sm font-bold text-slate-700 mb-2 px-1">${c.name}</p>
          <div class="grid grid-cols-4 gap-3">
            ${SKINS.filter(s => s.char === c.key).map(s => {
              const isOpen = open.includes(s.id);
              return `
              <button class="skin-card ${isOpen ? '' : 'locked'} ${equippedSkin === s.id ? 'on' : ''}" data-skin="${s.id}">
                <img src="${skinSrc(s.id)}" alt="${s.name}" onerror="this.style.visibility='hidden'">
                ${isOpen ? '' : '<span class="lock">🔒</span>'}
              </button>`;
            }).join('')}
          </div>
        </div>`).join('')}
      <p class="text-[11px] text-slate-400 text-center pt-1">컬렉션 한 줄을 완성해 쿠폰을 받으면 새 캐릭터가 해금돼요</p>
    </div>`;
}
function openSkinSheet() {
  const sh = openSheet(skinSheetHTML(), '52%');
  const bind = () => sh.el.querySelectorAll('.skin-card').forEach(b => b.onclick = () => {
    const id = b.dataset.skin;
    if (!unlockedSkins().includes(id)) return toast('아직 잠겨 있어요 · 컬렉션을 완성해 보세요');
    equippedSkin = id;
    store('equippedSkin', id);
    go('home');                              // 뒤에 있는 홈 캐릭터 바로 변경
    sh.el.innerHTML = skinSheetHTML(); bind();
    toast(`${findSkin(id).name}(으)로 변경!`);
  });
  bind();
}
// 홈: 위로 밀거나 손잡이를 누르면 스킨 창 열기
function bindHome() {
  const area = $('#homeArea');
  let y0 = null;
  area.onpointerdown = e => { y0 = e.clientY; };
  area.onpointerup = e => { if (y0 !== null && y0 - e.clientY > 50) openSkinSheet(); y0 = null; };
  $('#skinHandle').onclick = openSkinSheet;
}

// ═════════════════ 컬렉션 · 쿠폰 ═════════════════
const REGIONS = ['종로구', '강남구', '중구', '서대문구'];
const COUPON_TITLE = '한정선 20% 할인 쿠폰';
// 쿠폰 데이터 형태 (백엔드 연결 시 이 형태로 받으면 됨)
// { id, region, title, discount, issuedAt, used }
let coupons = store('coupons') || [];

function renderCollection() {
  const got = LANDMARKS.filter(l => GOT.has(l.id)).length;
  return `
  <div class="p-4 space-y-4 rise">
    <div class="flex items-end justify-between px-1">
      <div>
        <p class="text-xs text-slate-400">MY COLLECTION</p>
        <h2 class="text-lg font-black text-slate-800">지역 뱃지 컬렉션</h2>
      </div>
      <p class="text-sm font-bold text-amber-500">${got} / ${LANDMARKS.length}</p>
    </div>
    ${REGIONS.map(region => {
      const badges = LANDMARKS.filter(l => l.region === region);
      const count = badges.filter(b => GOT.has(b.id)).length;
      const done = coupons.some(c => c.region === region);
      const btn = done ? ['done', '받음<br>✓'] : count === badges.length ? ['ready', '달성'] : ['locked', `${count}/${badges.length}`];
      return `
      <div class="bg-white rounded-3xl p-4 shadow-sm">
        <p class="text-sm font-bold text-slate-700 mb-3">📍 ${region}</p>
        <div class="flex items-center gap-3">
          <div class="flex-1 flex justify-between bg-slate-50 rounded-2xl px-3 py-3">
            ${badges.map(b => {
              const on = GOT.has(b.id);
              return `
              <div class="flex flex-col items-center gap-1 w-16">
                <div class="badge-circle ${on ? 'on' : 'off'}">${badgeImg(b, on ? '' : '?')}</div>
                <span class="text-[11px] ${on ? 'text-slate-700 font-medium' : 'text-slate-400'} whitespace-nowrap">${b.name}</span>
              </div>`;
            }).join('')}
          </div>
          <button class="claim-btn ${btn[0]}" data-region="${region}">${btn[1]}</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function bindCollection() {
  document.querySelectorAll('.claim-btn').forEach(b => b.onclick = () => {
    const region = b.dataset.region;
    const left = LANDMARKS.filter(l => l.region === region && !GOT.has(l.id)).length;
    if (coupons.some(c => c.region === region)) return toast('이미 받은 쿠폰이에요');
    if (left > 0) return toast(`뱃지 ${left}개 더 모아야 해요`);
    const c = { id: `c-${Date.now()}`, region, title: COUPON_TITLE, discount: 20,
                issuedAt: new Date().toLocaleDateString('ko-KR'), used: false };
    coupons.push(c);
    store('coupons', coupons);
    const newSkin = REWARD_ORDER[coupons.length - 1] || null;   // 이번에 해금된 스킨
    go('collection');
    showCoupon(c, newSkin);
  });
}
function couponCard(c) {
  return `
    <div class="coupon text-left ${c.used ? 'used' : ''}">
      <p class="text-xs font-bold tracking-widest opacity-80">SEOUL GO COUPON</p>
      <p class="text-5xl font-black mt-1">${c.discount}<span class="text-2xl">% OFF</span></p>
      <div class="divider"></div>
      <div class="flex justify-between text-xs opacity-90"><span>${c.region} 제휴 매장</span><span>발급일 ${c.issuedAt}</span></div>
    </div>`;
}
function showCoupon(c, newSkin) {
  openModal(`
    <div class="text-center">
      <p class="text-3xl font-black text-slate-800">축하합니다!</p>
      <p class="text-sm text-slate-500 mt-1 mb-6">${c.region} 컬렉션을 모두 모았어요 🎉</p>
      ${couponCard(c)}
      <p class="mt-5 text-lg font-bold text-slate-800">${c.title}</p>
      ${newSkin ? `
        <div class="mt-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left">
          <img src="${skinSrc(newSkin)}" alt="" class="w-14 h-14 object-contain">
          <div><p class="text-xs text-amber-600 font-bold">NEW 캐릭터 해금!</p>
          <p class="font-bold text-slate-800">${findSkin(newSkin).name}</p>
          <p class="text-[11px] text-slate-500">홈에서 위로 밀어 바꿀 수 있어요</p></div>
        </div>` : ''}
      <button class="close mt-6 w-full bg-blue-700 text-white rounded-xl py-3 font-medium">확인</button>
    </div>`);
}
function openCouponBox() {
  const usable = coupons.filter(c => !c.used).length;
  const sheet = openSheet(`
    <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200">
      <div>
        <p class="text-xl font-black text-slate-800">내 쿠폰함</p>
        <p class="text-xs text-slate-500 mt-0.5">사용 가능 ${usable}장 · 전체 ${coupons.length}장</p>
      </div>
      <button class="close w-10 h-10 rounded-full bg-slate-200 text-slate-600 text-lg" aria-label="닫기">✕</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      ${coupons.length ? coupons.slice().reverse().map(c => `
        <div>
          ${couponCard(c)}
          <div class="flex items-center justify-between mt-3 px-1">
            <p class="font-bold text-slate-800">${c.title}</p>
            ${c.used
              ? '<span class="text-xs text-slate-400">사용 완료</span>'
              : `<button class="use-btn text-xs font-bold text-white bg-blue-700 rounded-full px-3 py-1.5" data-id="${c.id}">사용하기</button>`}
          </div>
        </div>`).join('')
      : '<div class="text-center text-slate-400 py-24"><div class="text-5xl mb-3">🎟️</div>아직 받은 쿠폰이 없어요.<br>컬렉션을 완성해 보세요!</div>'}
    </div>`);
  sheet.el.querySelectorAll('.use-btn').forEach(b => b.onclick = () => {
    const c = coupons.find(x => x.id === b.dataset.id);
    const m = openModal(`
      <div class="text-center">
        <p class="text-sm text-slate-500">매장 직원에게 보여주세요</p>
        <p class="text-lg font-bold mt-2">${c.title}</p>
        <p class="text-2xl font-black tracking-widest my-5 font-mono">${c.id.toUpperCase()}</p>
        <button class="confirm w-full bg-blue-700 text-white rounded-xl py-3 font-medium">사용 완료 처리</button>
        <button class="close mt-2 w-full text-slate-500 py-2 text-sm">취소</button>
      </div>`);
    m.querySelector('.confirm').onclick = () => {
      c.used = true; store('coupons', coupons);
      m.remove(); sheet.close();
      openCouponBox();
      toast('쿠폰을 사용했어요');
    };
  });
}

// ═════════════════ 설정 ═════════════════
let notifyOn = store('notifyOn') ?? true;

function renderSettings() {
  const badgeCount = LANDMARKS.filter(l => GOT.has(l.id)).length;
  return `
  <div class="p-4 rise">
    <div class="flex items-center gap-4 bg-white rounded-3xl p-4 shadow-sm mb-4">
      <div class="w-14 h-14 rounded-full overflow-hidden bg-sky-100 shrink-0">
        <img src="${skinSrc(equippedSkin)}" alt="" class="w-full h-full object-contain" onerror="this.remove()" />
      </div>
      <div>
        <p class="font-bold text-slate-800">${userName}</p>
        <p class="text-xs text-slate-500">뱃지 ${badgeCount}개 · 쿠폰 ${coupons.length}장</p>
      </div>
    </div>
    <div class="bg-white rounded-3xl px-4 shadow-sm">
      <button class="set-row" data-act="coupons"><span>🎟️ 내 쿠폰함</span><span class="text-slate-400">›</span></button>
      <button class="set-row" data-act="notify"><span>🔔 알림 설정</span><span class="switch ${notifyOn ? 'on' : ''}"></span></button>
      <button class="set-row" data-act="location"><span>📍 위치 권한</span><span class="text-slate-400">›</span></button>
      <button class="set-row" data-act="camera"><span>📷 카메라 권한</span><span class="text-slate-400">›</span></button>
      <button class="set-row" data-act="mic"><span>🎙️ 마이크 권한</span><span class="text-slate-400">›</span></button>
      <button class="set-row" data-act="lang"><span>🌐 언어 설정</span><span class="text-xs text-slate-400">${LANGS.find(l => l.code === lang).name} ›</span></button>
      <button class="set-row !border-0" data-act="info"><span>ℹ️ 앱 정보</span><span class="text-xs text-slate-400">v0.1 (해커톤)</span></button>
    </div>
    <button id="logout" class="mt-6 w-full border border-slate-300 bg-white rounded-xl py-3 text-slate-600">로그아웃</button>
  </div>`;
}
function bindSettings() {
  document.querySelectorAll('.set-row').forEach(b => b.onclick = () => {
    const act = b.dataset.act;
    if (act === 'coupons') openCouponBox();
    if (act === 'notify') {
      notifyOn = !notifyOn; store('notifyOn', notifyOn);
      b.querySelector('.switch').classList.toggle('on', notifyOn);
      toast(notifyOn ? '알림을 켰어요' : '알림을 껐어요');
    }
    if (act === 'location') {
      navigator.geolocation.getCurrentPosition(
        () => toast('위치 권한이 허용되어 있어요'),
        () => toast('브라우저 주소창 왼쪽에서 위치 권한을 허용해 주세요'));
    }
    if (act === 'camera' || act === 'mic') {
      const isCam = act === 'camera', label = isCam ? '카메라' : '마이크';
      if (!navigator.mediaDevices?.getUserMedia) return toast(`이 브라우저는 ${label}를 지원하지 않아요`);
      navigator.mediaDevices.getUserMedia(isCam ? { video: true } : { audio: true })
        .then(s => { s.getTracks().forEach(t => t.stop()); toast(`${label} 권한이 허용되어 있어요`); })
        .catch(() => toast(`브라우저 주소창 왼쪽에서 ${label} 권한을 허용해 주세요`));
    }
    if (act === 'lang') openLangModal();
    if (act === 'info') toast('SEOUL GO · 2026 해커톤 프로토타입');
  });
}

// ═════════════════ 탭 / 화면 전환 ═════════════════
const PAGES = {
  home: () => `
    <div id="homeArea" class="home-bg relative h-full flex flex-col items-center justify-center rise select-none" style="touch-action:none">
      ${character(240)}
      <div class="w-32 h-3 bg-slate-300/50 rounded-full blur-sm mt-3"></div>
      <p class="mt-6 text-lg font-bold text-slate-800 bg-white/80 rounded-full px-4 py-1.5">오늘은 어디로 떠나볼까?</p>
      <button id="skinHandle" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 px-5 py-2 bg-white/80 rounded-2xl">
        <span class="w-10 h-1.5 rounded-full bg-slate-400"></span>
        <span class="text-xs text-slate-600">위로 밀어서 스킨 변경</span>
      </button>
    </div>`,
  map:        renderMap,
  landmark:   renderLandmark,
  mission:    renderMission,
  collection: renderCollection,
  settings:   renderSettings,
};
const BINDS = { home: bindHome, map: bindMap, landmark: bindLandmark, mission: bindMission, collection: bindCollection, settings: bindSettings };

function go(tab) {
  stopGuideSpeech();
  cancelMissionRecording();
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  stopCam();
  const activeTab = (tab === 'landmark' || tab === 'mission') ? 'map' : tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  $('#view').innerHTML = PAGES[tab]();
  $('#view').scrollTop = 0;
  BINDS[tab]?.();
  $('#logout')?.addEventListener('click', logout);
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));

// ═════════════════ 로그인 ═════════════════
async function login(id, password) {
  const response = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: id, password }),
  });
  const body = await response.json().catch(() => null);
  if (response.ok && body?.success && body.data?.accessToken) {
    accessToken = body.data.accessToken;
    return true;
  }
  if (body?.code === 'LOGIN_FAILED') return false;
  throw new Error('LOGIN_REQUEST_FAILED');
}

async function logout() {
  const token = accessToken;
  showLogin();
  if (!token) return;
  try {
    const response = await fetch(API_BASE + '/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('LOGOUT_REQUEST_FAILED');
  } catch {
    toast(lang === 'en' ? 'Could not notify the server of sign-out.' : '서버에 로그아웃을 알리지 못했어요.');
  }
}

function showMain(name) {
  userName = name;
  $('#loginScreen').classList.add('hidden');
  $('#mainScreen').classList.replace('hidden', 'flex');
  $('#welcome').textContent = `${name}님`;
  go('home');
  askLocationConsent();
}
// 로그인 직후 위치 정보 이용 동의
function askLocationConsent() {
  const m = openModal(`
    <div class="text-center">
      <div class="text-5xl">📍</div>
      <p class="text-xl font-black text-slate-800 mt-3">위치 정보 이용 동의</p>
      <p class="text-sm text-slate-500 mt-2 leading-relaxed">주변 랜드마크를 찾고 미션 장소에 도착했는지<br>확인하기 위해 위치 정보를 사용해요.</p>
      <ul class="text-left text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mt-4 space-y-1">
        <li>· 수집 항목: 현재 위치(위도·경도)</li>
        <li>· 이용 목적: 지도 표시, 미션 장소 도착 확인</li>
        <li>· 위치 기록은 서버에 저장하지 않아요</li>
      </ul>
      <button class="agree mt-5 w-full bg-blue-700 text-white rounded-xl py-3 font-bold">동의하고 계속하기</button>
      <button class="close mt-2 w-full text-slate-500 py-2 text-sm">나중에 하기</button>
    </div>`);
  m.querySelector('.agree').onclick = () => {
    m.remove();
    store('locationAgreed', true);
    if (!navigator.geolocation) return toast('위치 정보 이용에 동의했어요');
    navigator.geolocation.getCurrentPosition(
      () => toast('위치 정보 이용에 동의했어요'),
      () => toast('브라우저 주소창 왼쪽에서 위치 권한을 허용해 주세요'));
  };
}
function showLogin() {
  stopGuideSpeech();
  stopCam();
  cancelMissionRecording();
  accessToken = '';
  $('#mainScreen').classList.replace('flex', 'hidden');
  $('#loginScreen').classList.remove('hidden');
  $('#userPw').value = '';
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('#userId').value.trim(), pw = $('#userPw').value;
  if (!id || !pw) {
    $('#loginError').textContent = '아이디와 비밀번호를 입력해 주세요.';
    const f = $('#loginForm'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    return;
  }
  const submit = e.currentTarget.querySelector('button[type="submit"]');
  if (submit.disabled) return;
  const error = $('#loginError');
  error.textContent = '';
  submit.disabled = true;
  try {
    if (await login(id, pw)) showMain(id);
    else error.textContent = '아이디 또는 비밀번호가 맞지 않아요.';
  } catch {
    error.textContent = '로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    submit.disabled = false;
  }
});
$('#findId').onclick = () => toast('아이디 찾기는 준비 중이에요');
$('#findPw').onclick = () => toast('비밀번호 찾기는 준비 중이에요');

// ═════════════════ 언어 설정 ═════════════════
// 한국어 · 영어만 실제 동작, 나머지는 '준비 중'
const LANGS = [
  { code: 'ko', name: '한국어',   ready: true },
  { code: 'en', name: 'English',  ready: true },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'vi', name: 'Tiếng Việt' },
];
let lang = store('lang') || 'ko';

// 화면 문구 → 영어
const EN = {
  // 로그인
  '서울을 걷고, 미션을 깨고, 뱃지를 모으자': 'Walk Seoul, clear missions, collect badges',
  '아이디': 'ID', '비밀번호': 'Password', '로그인': 'Log in',
  '아이디 찾기': 'Find ID', '비밀번호 찾기': 'Find password',
  '아이디와 비밀번호를 입력해 주세요.': 'Please enter your ID and password.',
  '아이디 또는 비밀번호가 맞지 않아요.': 'Incorrect ID or password.',
  '아이디 찾기는 준비 중이에요': 'Find ID is coming soon',
  '비밀번호 찾기는 준비 중이에요': 'Find password is coming soon',
  // 메뉴 · 홈
  '홈': 'Home', '지도': 'Map', '컬렉션': 'Collection', '설정': 'Settings',
  '오늘은 어디로 떠나볼까?': 'Where shall we go today?',
  '위로 밀어서 스킨 변경': 'Swipe up to change skin',
  // 지도
  '지도 불러오는 중…': 'Loading map…', '지도를 불러오지 못했어요': 'Could not load the map',
  '📍 내 위치': '📍 My location', '주변 랜드마크': 'Nearby landmarks', '미션 가능': 'Mission ready',
  '시연용: 목록을 누르면 그 장소 앞으로 이동해요': 'Demo: tap a place to move there',
  '현재 위치를 불러왔어요': 'Got your current location', '위치 권한을 허용해 주세요': 'Please allow location access',
  '미션 시작': 'Start mission', '이 장소로 이동': 'Move here', '획득 완료': 'Collected', '미획득': 'Not collected',
  '지역 정보': 'Place info', '궁금한 게 있으면 뭐든 물어봐!': 'Ask me anything about this place!',
  '이 장소에 대해 물어보세요': 'Ask about this place', '전송': 'Send',
  'AI 답변 기능은 준비 중이에요. 곧 대답해 줄게!': 'AI answers are coming soon!',
  '미션 화면은 준비 중이에요': 'Mission screen is coming soon', '내 위치': 'My location',
  // 미션
  '이 장소의 미션은 준비 중이에요': 'Missions for this place are coming soon',
  '사진 미션': 'Photo mission', '음성 미션': 'Voice mission', '사진 미션 촬영': 'Photo mission',
  '사진과 같은 포즈로': 'Strike the same pose', '인증샷을 찍어보세요!': 'and take a photo!',
  '예시 포즈 사진': 'Example pose', '예시 포즈': 'Example',
  '팔과 상체가 잘 보이게 찍어주세요': 'Make sure the landmark is in the shot',
  '예시 사진과 같은 포즈를 취해주세요': 'Copy the pose in the example photo',
  '앱 카메라로만 촬영할 수 있어요': 'Photos can only be taken with the in-app camera',
  '📷 촬영 시작': '📷 Start camera', '카메라 미리보기': 'Camera preview',
  '카메라를 사용할 수 없어 시연 모드로 진행해요': 'Camera unavailable · continuing in demo mode',
  'AI가 사진을 확인하고 있어요…': 'AI is checking your photo…',
  '아래 문장을 소리 내어': 'Read the sentence below', '따라 읽어보세요!': 'out loud!',
  '눌러서 녹음 시작': 'Tap to record', '녹음 중… 다 읽으면 다시 누르세요': 'Recording… tap again when done',
  '분석 중…': 'Analyzing…', '문장 일치도': 'Sentence match', '포즈 점수': 'Pose score',
  '미션 성공!': 'Mission complete!', '미션 실패': 'Mission failed',
  '컬렉션에서 확인할 수 있어요': 'Check it in your Collection', '컬렉션 보기': 'View collection',
  '랜드마크와 포즈가 잘 보이게 다시 찍어보세요': 'Retake with the landmark and your pose clearly visible',
  '다시 한번 해보세요!': 'Give it another try!', '다시 촬영하기': 'Retake photo', '다시 녹음하기': 'Record again',
  '나중에 하기': 'Maybe later',
  // 위치 동의
  '위치 정보 이용 동의': 'Location Access', '동의하고 계속하기': 'Agree and continue',
  '주변 랜드마크를 찾고 미션 장소에 도착했는지': 'We use your location to find nearby landmarks',
  '확인하기 위해 위치 정보를 사용해요.': 'and check that you have arrived at mission spots.',
  '· 수집 항목: 현재 위치(위도·경도)': '· Collected: current location (latitude · longitude)',
  '· 이용 목적: 지도 표시, 미션 장소 도착 확인': '· Purpose: map display, mission arrival check',
  '· 위치 기록은 서버에 저장하지 않아요': '· Your location history is not stored on our server',
  '위치 정보 이용에 동의했어요': 'Location access agreed',
  // 장소 · 지역
  '강남': 'Gangnam', '코엑스': 'COEX', '봉은사': 'Bongeunsa Temple',
  '남산': 'Namsan', '명동': 'Myeongdong', '덕수궁': 'Deoksugung Palace',
  '독립문': 'Independence Gate', '서대문형무소': 'Seodaemun Prison', '신촌': 'Sinchon',
  '광화문': 'Gwanghwamun', '경복궁': 'Gyeongbokgung Palace', '북촌': 'Bukchon',
  '강남구': 'Gangnam-gu', '중구': 'Jung-gu', '서대문구': 'Seodaemun-gu', '종로구': 'Jongno-gu',
  '서울의 대표 번화가': "Seoul's iconic downtown", '대형 전시장과 별마당 도서관': 'Expo center & Starfield Library',
  '도심 속 천년 고찰': 'A 1,000-year-old temple downtown', 'N서울타워와 서울 전경': 'N Seoul Tower & city views',
  '쇼핑과 길거리 음식': 'Shopping & street food', '돌담길이 아름다운 궁': 'Palace with a famous stone-wall road',
  '자주독립 의지를 담은 문': 'Symbol of Korean independence', '독립운동의 역사 현장': 'Historic site of the independence movement',
  '대학가 문화의 거리': 'University district streets', '세종대왕상과 이순신 장군상': 'Statues of King Sejong & Admiral Yi',
  '조선 왕조의 법궁': 'Main palace of the Joseon Dynasty', '전통 한옥 마을': 'Traditional hanok village',
  // 스킨
  '스킨': 'Skins', '백호': 'Baekho', '서민 백호': 'Commoner Baekho', '양반 백호': 'Noble Baekho', '왕 백호': 'King Baekho',
  '청룡': 'Cheongryong', '현무': 'Hyeonmu', '주작': 'Jujak',
  '컬렉션 한 줄을 완성해 쿠폰을 받으면 새 캐릭터가 해금돼요': 'Complete a collection row to unlock a new character',
  '아직 잠겨 있어요 · 컬렉션을 완성해 보세요': 'Locked · complete a collection to unlock',
  // 컬렉션 · 쿠폰
  '지역 뱃지 컬렉션': 'Regional Badge Collection', '달성': 'Claim', '받음': 'Got',
  '이미 받은 쿠폰이에요': 'Coupon already claimed',
  '축하합니다!': 'Congratulations!', '확인': 'OK', '한정선 20% 할인 쿠폰': 'Hanjeongseon 20% Off Coupon',
  'NEW 캐릭터 해금!': 'NEW character unlocked!', '홈에서 위로 밀어 바꿀 수 있어요': 'Swipe up on Home to switch',
  '내 쿠폰함': 'My Coupons', '사용 완료': 'Used', '사용하기': 'Use',
  '아직 받은 쿠폰이 없어요.': 'No coupons yet.', '컬렉션을 완성해 보세요!': 'Complete a collection!',
  '매장 직원에게 보여주세요': 'Show this to the store staff', '사용 완료 처리': 'Mark as used', '취소': 'Cancel',
  '쿠폰을 사용했어요': 'Coupon used', '닫기': 'Close',
  // 설정
  '🎟️ 내 쿠폰함': '🎟️ My Coupons', '🔔 알림 설정': '🔔 Notifications', '📍 위치 권한': '📍 Location access',
  '📷 카메라 권한': '📷 Camera access', '🎙️ 마이크 권한': '🎙️ Microphone access', '🌐 언어 설정': '🌐 Language',
  'ℹ️ 앱 정보': 'ℹ️ About', 'v0.1 (해커톤)': 'v0.1 (Hackathon)', '로그아웃': 'Log out',
  '알림을 켰어요': 'Notifications on', '알림을 껐어요': 'Notifications off',
  '위치 권한이 허용되어 있어요': 'Location access is allowed',
  '브라우저 주소창 왼쪽에서 위치 권한을 허용해 주세요': 'Allow location access from the left of the address bar',
  'SEOUL GO · 2026 해커톤 프로토타입': 'SEOUL GO · 2026 Hackathon Prototype',
  '언어 설정': 'Language', '준비 중': 'Coming soon', '이 언어는 준비 중이에요': 'This language is coming soon',
};
// 지역 정보 말풍선 (영어)
Object.assign(EN, {
  [LANDMARK_INFO.gangnam]:     "Seoul's iconic downtown around Gangnam Station and Teheran-ro. Shopping, food and K-POP culture all in one place!",
  [LANDMARK_INFO.coex]:        'A huge complex with the Starfield Library and an aquarium. Photos in front of the giant bookshelves are a must!',
  [LANDMARK_INFO.bongeunsa]:   'An old temple right next to COEX. The view of a quiet temple among skyscrapers is amazing!',
  [LANDMARK_INFO.namsan]:      'A mountain in the heart of Seoul. See the whole city from N Seoul Tower and walk the old city wall trail!',
  [LANDMARK_INFO.myeongdong]:  'A street famous for shopping and street food. Myeongdong Cathedral is nearby too!',
  [LANDMARK_INFO.deoksugung]:  'Once the palace of the Korean Empire. Its stone-wall road is one of the prettiest walks in Seoul!',
  [LANDMARK_INFO.dongnipmun]:  'Built in 1897 by the Independence Club as a symbol of Korean independence. It stands in Seodaemun Independence Park.',
  [LANDMARK_INFO.seodaemun]:   'A prison where many independence activists were held during Japanese rule. Today it is a history museum.',
  [LANDMARK_INFO.sinchon]:     'A lively university district full of cafes, live shows and great food!',
  [LANDMARK_INFO.gwanghwamun]: 'The main gate of Gyeongbokgung. The square in front has statues of King Sejong and Admiral Yi!',
  [LANDMARK_INFO.gyeongbok]:   'The first royal palace of the Joseon Dynasty, built in 1395. Geunjeongjeon and Gyeonghoeru are must-sees!',
  [LANDMARK_INFO.bukchon]:     'A hanok village between Gyeongbokgung and Changdeokgung. Every alley keeps its traditional charm!',
});
const tr = k => EN[k] ?? k;
const DEVICE = { '카메라': 'camera', '마이크': 'microphone' };
// 숫자·이름이 들어가는 문구
const EN_RULES = [
  [/^(.+)님$/,                              m => m[1]],
  [/^(.+) 앞으로 이동했어요$/,              m => `Moved to ${tr(m[1])}`],
  [/^(.+)에 온 걸 환영해!$/,                m => `Welcome to ${tr(m[1])}!`],
  [/^(.+) 뱃지를 획득했어요!$/,             m => `You earned the ${tr(m[1])} badge!`],
  [/^문장 일치도 (\d+)% 이상이면 성공!$/,   m => `Score ${m[1]}% or higher to pass!`],
  [/^📍 (.+)$/,                             m => `📍 ${tr(m[1])}`],
  [/^(백호|청룡|현무|주작) (\d)$/,          m => `${tr(m[1])} ${m[2]}`],
  [/^해금 (\d+) \/ (\d+)$/,                 m => `Unlocked ${m[1]} / ${m[2]}`],
  [/^(.+)\(으\)로 변경!$/,                  m => `Switched to ${tr(m[1])}!`],
  [/^뱃지 (\d+)개 더 모아야 해요$/,         m => `Collect ${m[1]} more badge(s)`],
  [/^(.+) 컬렉션을 모두 모았어요 🎉$/,      m => `You completed ${tr(m[1])}! 🎉`],
  [/^(.+) 제휴 매장$/,                      m => `${tr(m[1])} partner stores`],
  [/^발급일 (.+)$/,                         m => `Issued ${m[1]}`],
  [/^사용 가능 (\d+)장 · 전체 (\d+)장$/,    m => `${m[1]} available · ${m[2]} total`],
  [/^뱃지 (\d+)개 · 쿠폰 (\d+)장$/,         m => `${m[1]} badges · ${m[2]} coupons`],
  [/^(카메라|마이크) 권한이 허용되어 있어요$/,               m => `${DEVICE[m[1]]} access is allowed`],
  [/^브라우저 주소창 왼쪽에서 (카메라|마이크) 권한을 허용해 주세요$/, m => `Allow ${DEVICE[m[1]]} access from the left of the address bar`],
  [/^이 브라우저는 (카메라|마이크)를 지원하지 않아요$/,     m => `This browser does not support the ${DEVICE[m[1]]}`],
  [/^(.+) ›$/,                              m => `${tr(m[1])} ›`],
];
function trText(s) {
  const k = s.trim();
  if (!k) return s;
  let out = EN[k];
  if (out === undefined) for (const [re, f] of EN_RULES) { const m = k.match(re); if (m) { out = f(m); break; } }
  return out === undefined ? s : s.replace(k, out);
}
// 화면 글자 바꾸기 (원래 한국어는 기억해 둠)
function translate(root) {
  if (lang !== 'en' || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n._ko === undefined) n._ko = n.nodeValue;
    n.nodeValue = trText(n._ko);
  }
  root.querySelectorAll?.('[placeholder]').forEach(el => {
    if (el._ko === undefined) el._ko = el.placeholder;
    el.placeholder = trText(el._ko);
  });
}
function restoreKorean(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (n._ko !== undefined) n.nodeValue = n._ko;
  root.querySelectorAll('[placeholder]').forEach(el => { if (el._ko !== undefined) el.placeholder = el._ko; });
}
// 새로 그려지는 화면 · 팝업 · 알림도 자동으로 번역
new MutationObserver(list => {
  if (lang !== 'en') return;
  list.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 3) { n._ko = n.nodeValue; n.nodeValue = trText(n.nodeValue); }
    else if (n.nodeType === 1) translate(n);
  }));
}).observe(document.body, { childList: true, subtree: true });

function setLang(code) {
  if (code === lang) return;
  lang = code;
  store('lang', code);
  document.documentElement.lang = code;
  if (code === 'en') translate(document.body); else restoreKorean(document.body);
  go('settings');
  toast(code === 'en' ? 'Switched to English' : '한국어로 변경했어요');
}
function openLangModal() {
  const m = openModal(`
    <p class="text-lg font-black text-slate-800 mb-4">언어 설정</p>
    <div class="space-y-2">
      ${LANGS.map(l => `
        <button class="lang-btn w-full flex justify-between items-center px-4 py-3 rounded-xl border ${l.code === lang ? 'border-blue-700 bg-blue-50' : 'border-slate-200'}" data-code="${l.code}">
          <span class="font-medium ${l.ready ? 'text-slate-800' : 'text-slate-400'}">${l.name}</span>
          <span class="text-xs ${l.code === lang ? 'text-blue-700 font-bold' : 'text-slate-400'}">${l.code === lang ? '✓' : (l.ready ? '' : '준비 중')}</span>
        </button>`).join('')}
    </div>
    <button class="close mt-5 w-full bg-slate-100 text-slate-600 rounded-xl py-3">닫기</button>`);
  m.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => {
    const l = LANGS.find(x => x.code === b.dataset.code);
    if (!l.ready) return toast('이 언어는 준비 중이에요');
    m.remove();
    setLang(l.code);
  });
}
document.documentElement.lang = lang;
translate(document.body);
