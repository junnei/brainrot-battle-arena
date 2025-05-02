import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BrainrotProvider } from './context/BrainrotContext';
import BottomNav from './components/layout/BottomNav';
import LanguageSwitcher from './components/ui/LanguageSwitcher';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import BrainrotFormPage from './pages/BrainrotFormPage';
import ProfilePage from './pages/ProfilePage';
import BattlePage from './pages/BattlePage';
import ResultPage from './pages/ResultPage';
import BattleDetailPage from './pages/BattleDetailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';
import { useEffect } from 'react';
import i18n from './i18n';

function App() {
  // 앱 초기화 시 언어 설정 강제 적용
  useEffect(() => {
    // 브라우저 감지가 ko-KR일 경우 ko로 설정하기 위한 코드
    const currentLang = i18n.language;
    if (currentLang.startsWith('ko')) {
      if (currentLang !== 'ko') {
        i18n.changeLanguage('ko');
        // 로컬 스토리지에도 업데이트
        localStorage.setItem('i18nextLng', 'ko');
      }
    } else if (currentLang.startsWith('en')) {
      if (currentLang !== 'en') {
        i18n.changeLanguage('en');
        localStorage.setItem('i18nextLng', 'en');
      }
    } else {
      // 기본 언어를 한국어로 설정
      i18n.changeLanguage('ko');
      localStorage.setItem('i18nextLng', 'ko');
    }
  }, []);

  return (
    <AuthProvider>
      <BrainrotProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gaming-dark text-gaming-light">
            <LanguageSwitcher />
            <main className="flex-grow pb-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route 
                  path="/create-brainrot" 
                  element={
                    <ProtectedRoute>
                      <BrainrotFormPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/battle" 
                  element={
                    <ProtectedRoute>
                      <BattlePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/result" 
                  element={
                    <ProtectedRoute>
                      <ResultPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/battle/:battleId" 
                  element={
                    <ProtectedRoute>
                      <BattleDetailPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </Router>
      </BrainrotProvider>
    </AuthProvider>
  );
}

export default App;