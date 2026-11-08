import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CommunicatePage from './pages/CommunicatePage';
import SessionHistoryPage from './pages/SessionHistoryPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const AppContent = (
    <AuthProvider>
      <AccessibilityProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            {/* Global Accessible Navigation */}
            <Navbar onOpenAuth={handleOpenAuth} />

            {/* Application Main Content Routes */}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage onOpenAuth={handleOpenAuth} />} />
                <Route path="/login" element={<AuthPage initialMode="login" />} />
                <Route path="/register" element={<AuthPage initialMode="register" />} />
                <Route path="/communicate" element={<CommunicatePage onOpenAuth={handleOpenAuth} />} />
                <Route path="/history" element={<SessionHistoryPage onOpenAuth={handleOpenAuth} />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>

            {/* Unified Accessible Footer */}
            <Footer />

            {/* Authentication Modal */}
            <AuthModal
              isOpen={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
              initialMode={authMode}
            />
          </div>
        </Router>
      </AccessibilityProvider>
    </AuthProvider>
  );

  if (googleClientId && googleClientId.trim() !== '') {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {AppContent}
      </GoogleOAuthProvider>
    );
  }

  return AppContent;
}

export default App;
