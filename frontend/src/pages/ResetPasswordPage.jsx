import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleResetPassword } = useApp();
  const [newPassword, setNewPassword] = useState("");
  const token = searchParams.get("token"); // URL'den ?token=XYZ değerini okur

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    const success = await handleResetPassword(token, newPassword);
    if (success) {
      navigate("/login"); // Şifre değişince giriş ekranına yönlendirir
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center blueprint-grid" style={{ background: "#14161A" }}>
      <div className="p-10 rounded-[3rem] shadow-2xl border w-full max-w-sm space-y-6" style={{ background: "#1F2328", borderColor: "#33383F" }}>
        <h2 className="text-xl font-black text-center" style={{ color: "#F2EFEA" }}>Yeni Şifre Belirleyin</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Yeni Şifreniz"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-2xl px-5 py-3 outline-none font-bold text-sm"
            style={{ background: "#101214", border: "1px solid #33383F", color: "#F2EFEA" }}
          />
          <button type="submit" className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest" style={{ background: "linear-gradient(150deg,#FF6B35,#C1440E)", color: "#1A1300" }}>
            Şifreyi Güncelle
          </button>
        </form>
      </div>
    </div>
  );
}