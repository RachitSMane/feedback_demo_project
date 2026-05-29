import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FAQPage from './pages/FAQPage';
import TicketPage from './pages/TicketPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const userData = localStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/" />}
            />
            <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/faq" element={isAuthenticated ? <FAQPage /> : <Navigate to="/login" />} />
            <Route path="/ticket" element={isAuthenticated ? <TicketPage /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/chatbot" element={isAuthenticated ? <ChatbotPage /> : <Navigate to="/login" />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;