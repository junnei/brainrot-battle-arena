import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 사용자 정의 언어 감지기 옵션
const languageDetectorOptions = {
  // 언어 코드에서 국가 코드 제거
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  convertLowerCaseLng: true,
  cleanCode: true, // 'ko-KR' -> 'ko'로 변환
  // 감지 순서
  order: ['localStorage', 'cookie', 'navigator'],
  // 감지된 언어 저장 위치
  caches: ['localStorage'],
};

i18n
  // HTTP backend를 사용하여 번역 파일 로드 (public/locales 폴더)
  .use(Backend)
  // 브라우저 언어 감지 (옵션 적용)
  .use(LanguageDetector)
  // i18n 인스턴스를 react-i18next에 전달
  .use(initReactI18next)
  // i18next 초기화
  .init({
    // 기본 언어
    fallbackLng: 'ko',
    // 국가 코드 제거하고 언어 코드만 사용 (ko-KR -> ko)
    load: 'languageOnly',
    // 지원 언어
    supportedLngs: ['ko', 'en'],
    // 디버깅 모드 (개발 중일 때 유용)
    debug: false, // 디버그 모드 비활성화
    // 번역 네임스페이스 (기본값 'translation')
    ns: ['translation'],
    defaultNS: 'translation',
    // 언어 감지 옵션
    detection: languageDetectorOptions,
    // 백엔드 옵션 (번역 파일 경로)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // React 통합 옵션
    react: {
      useSuspense: false, // Suspense 사용 여부 (비동기 로딩 시)
    },
  });

// 초기 언어 설정 (페이지 로드 시 직접 'ko' 설정)
const savedLang = localStorage.getItem('i18nextLng');
if (!savedLang || (savedLang.includes('-') && !['ko', 'en'].includes(savedLang.split('-')[0]))) {
  i18n.changeLanguage('ko');
}

export default i18n; 