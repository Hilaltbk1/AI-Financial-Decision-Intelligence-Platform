import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScenarioPage from './pages/ScenarioPage';
import ChatPage from './pages/ChatPage';
import DataModelPage from './pages/DataModelPage';
import ArchivePage from './pages/ArchivePage';
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />   {/* ✅ dışarı taşındı */}

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/senaryo" element={<ScenarioPage />} />
            <Route path="/sohbet" element={<ChatPage />} />
            <Route path="/veri-model" element={<DataModelPage />} />
            <Route path="/arsiv" element={<ArchivePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;