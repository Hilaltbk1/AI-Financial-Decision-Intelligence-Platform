import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// Daha önce App.jsx'teki /senaryo, /sohbet vb. rotalar token kontrolü
// olmadan tanımlıydı: giriş yapmamış biri URL'i doğrudan yazarsa sayfayı
// (boş veriyle) görebiliyordu. Bu bileşen token yoksa kullanıcıyı
// /login'e yönlendirir.
export default function ProtectedRoute({ children }) {
  const { token } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}