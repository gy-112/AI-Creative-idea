# 서울GO! (SEOUL GO!)

> **서울을 경험하고, 나만의 서울 캐릭터를 성장시키다.**

2026 K-콘텐츠 AI 해커톤 프로젝트

서울GO!는 서울의 역사·문화·예술·관광 명소를 AI 기반 미션으로 체험하고, 미션을 완료할 때마다 나만의 서울 캐릭터와 디지털 뱃지를 수집하는 참여형 지역 탐방 서비스입니다.

외국인 관광객과 서울을 새롭게 즐기고 싶은 방문객에게 다국어 기반의 개인화된 문화 체험을 제공합니다.

---

## 🎯 프로젝트 소개

| 항목 | 내용 |
|---|---|
| 서비스명 | 서울GO! (SEOUL GO!) |
| 서비스 유형 | AI 기반 지역 탐방 및 K-콘텐츠 체험 서비스 |
| 주요 타깃 | 한국 문화에 관심 있는 외국인 관광객 및 서울 방문객 |
| 핵심 가치 | Local to Global |
| 주요 기능 | AI 사진 인증, 한국어 음성 미션, 디지털 뱃지, 캐릭터 성장 |

### 💡 핵심 아이디어

기존 관광 서비스가 단순히 장소를 안내하는 데 그쳤다면, 서울GO!는 사용자가 직접 장소를 방문하고 미션을 수행하는 경험을 제공합니다.

- 서울의 랜드마크를 방문하고 사진·음성 미션 수행
- AI를 활용한 사진 및 음성 미션 분석
- 장소별 한정 디지털 뱃지 획득
- 미션 달성에 따라 나만의 서울 캐릭터 성장
- 다국어 기반의 역사·문화 정보 제공

**"서울을 구경하는 여행에서, 서울의 이야기를 직접 완성하는 여행으로."**

---

## 🗺️ 주요 기능

### 1. 나만의 서울 캐릭터 생성
- 사용자의 취향과 K-콘텐츠 선호 장르를 기반으로 기본 캐릭터 생성
- 질문을 통한 캐릭터 유형 선택
- 미션 완료 및 뱃지 획득에 따른 캐릭터 의상·소품 변화

### 2. 서울 랜드마크 탐방 및 미션
- 서울 주요 랜드마크 기반의 지역별 미션 제공
- 역사·문화·드라마·K-팝 등 다양한 주제의 미션
- 장소별 미션 및 보상 정보 확인

**MVP 대상 장소**
- 서대문 독립문
- 광화문
- 강남
- 남산

### 3. AI 사진 인증
- 랜드마크 사진 업로드
- Vision AI를 활용한 사진 속 장소 및 요구 장면 분석
- 미션 달성 여부 판정 및 결과 제공
- 인증 실패 시 재시도 안내

### 4. AI 한국어 음성 미션
- 한국어 대사 따라 말하기
- STT를 통한 음성 텍스트 변환
- 목표 문장과 사용자 발화 비교
- 발음 및 문장 완성도 피드백 제공

### 5. 디지털 뱃지 및 캐릭터 성장
- 장소별 고유 디지털 뱃지 획득
- 획득한 뱃지에 따른 캐릭터 아이템 해금
- 나의 뱃지 컬렉션 및 탐방 진행률 확인
- 캐릭터와 뱃지 이미지 저장 및 공유

---

## 🤖 AI 활용 기술

| 기능 | 활용 기술 | 설명 |
|---|---|---|
| 사진 미션 검증 | Vision AI / Multimodal LLM | 사진 속 랜드마크 및 미션 조건 분석 |
| 한국어 음성 인식 | STT (Soniox 검토 중) | 사용자 음성을 텍스트로 변환 |
| 발음 평가 | STT + 발음 분석 | 목표 문장과 사용자 발화 비교 및 피드백 |
| 랜드마크 설명 | LLM API | 장소별 역사·문화 정보 설명 및 질의응답 |
| 지역 기반 미션 생성 | LLM + RAG | 검증된 서울 문화자료를 기반으로 미션 생성 |

AI를 활용하여 단순한 QR 스탬프 방식에서 벗어나 사용자의 사진과 음성을 분석하고, 실제 체험 결과에 따라 보상을 제공하는 것이 핵심입니다.

---

## 🛠️ 기술 스택

### Backend

- Java 17
- Spring Boot 4.0.7
- Spring Data JPA
- Spring Security
- PostgreSQL
- Redis

### AI

- Vision AI / Multimodal LLM API (선정 예정)
- Soniox STT API (검토 중)
- LLM 기반 RAG

### Infrastructure & DevOps

- Docker / Docker Compose
- GitHub Actions
- AWS ECS Fargate
- Swagger UI

### Frontend

- Lovable 활용 예정

---

## 📂 프로젝트 구조

```text
src/main/java/jungkathon3team/aftergrow
├── auth/          # 회원가입 / 로그인 / 토큰 관리
├── running/       # 러닝 세션
├── heartrate/     # 심박수 측정
├── recovery/      # 회복 가이드
├── profile/       # 프로필 및 설정
└── common/        # 공통 응답, 예외 처리, 시큐리티 설정
```

※ 실제 서비스 도메인에 맞춰 패키지 구조를 확장 및 변경할 예정입니다.

---

## 🚀 로컬 개발 환경 세팅

### 1. 필수 설치

- JDK 17
- Docker Desktop
- Git

### 2. 저장소 클론

```bash
git clone https://github.com/gy-112/AI-Creative-idea
cd AI-Creative-idea
```

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 로컬 개발 환경에 필요한 값을 설정합니다.

`.env` 파일은 Git에 커밋하지 않습니다.

### 4. application-local.yml 설정

`src/main/resources/application-local.yml` 파일에서 다음 항목을 `.env`에 설정한 값과 동일하게 맞춥니다.

- `datasource.username`
- `datasource.password`

`application-local.yml` 역시 Git에 커밋하지 않습니다.

### 5. DB / Redis 실행

```bash
docker compose up -d
```

컨테이너 상태 확인:

```bash
docker compose ps
```

PostgreSQL과 Redis가 정상적으로 실행되는지 확인합니다.

### 6. 애플리케이션 실행

IntelliJ에서 `local` 프로파일로 실행하거나 다음 명령어를 사용합니다.

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 7. 정상 실행 확인

| 구분 | 주소 |
|---|---|
| API Server | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5432 |

DB명 및 계정 정보는 `.env` 파일을 참고합니다.

---

## 📡 주요 API 설계

| 기능 | Method | Endpoint |
|---|---|---|
| 캐릭터 생성 | POST | `/character/create` |
| 랜드마크 조회 | GET | `/landmarks` |
| 사진 미션 인증 | POST | `/missions/verify` |
| 미션 완료 및 뱃지 지급 | POST | `/missions/complete` |
| 사용자 컬렉션 조회 | GET | `/users/{id}/collection` |

※ 위 API는 기획 단계의 예시이며 실제 구현에 따라 변경될 수 있습니다.

---

## 🌱 MVP 개발 범위

### 필수 구현

- 한국어 / 영어 웹 인터페이스
- 4개 랜드마크 기반 미션
- 사진 업로드 및 AI 랜드마크 인증
- 미션 완료에 따른 디지털 뱃지 지급
- 기본 캐릭터 및 캐릭터 아이템 변경
- 뱃지 컬렉션 및 진행률 확인

### 추가 구현 목표

- 마이크 기반 한국어 대사 따라 하기
- GPS 기반 위치 인증 보조
- SNS 공유용 캐릭터 이미지 생성
- 지역 상권 연계 쿠폰 화면

---

## 🌏 향후 확장 가능성

- 서울 전역의 역사·문화·관광 명소로 서비스 확장
- 서울 축제 및 전시회 연계 특별 미션
- 다국어 지원 확대
- 지역 소상공인 및 관광기관과의 제휴
- 시즌 한정 뱃지 및 특별 캐릭터 아이템 제공

---

## 🌿 유의사항

- 미션에 활용되는 역사 및 문화 정보는 검증된 자료를 기반으로 제공합니다.
- 사진 인증만으로 실제 현장 방문 여부를 100% 보장할 수 없으므로 GPS 인증과 구분하여 처리합니다.
- 외부 IP 및 유명 캐릭터 활용 시 저작권과 이용 허락 여부를 확인합니다.
- `.env`, `application-local.yml` 등 민감한 설정 파일은 절대 커밋하지 않습니다.
- DB 스키마 변경은 Flyway 마이그레이션으로 관리합니다. `ddl-auto`를 통한 직접적인 스키마 변경은 지양합니다.

---

## 📚 문서

- API 명세서: Notion 링크 참고
- ERD: Notion 링크 참고
- 서비스 기획안: Notion 링크 참고

---

**SEOUL GO! | 서울을 경험하고, 나만의 서울을 수집하다.**
