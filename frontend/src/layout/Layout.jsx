import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Settings2, BrainCircuit, UploadCloud, History,
  Download, ShieldCheck, LogOut, AlertCircle
} from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
  { to: '/', label: 'Genel Bakış', desc: 'Özet KPI\'lar', icon: LayoutDashboard, section: 'Genel' },
  { to: '/senaryo', label: 'Senaryo Çalışma Alanı', desc: 'Kur · Çelik · Üretim', icon: Settings2, section: 'Çalışma' },
  { to: '/sohbet', label: 'AI Danışma Kurulu', desc: 'Sohbet & analiz', icon: BrainCircuit, section: 'Çalışma' },
  { to: '/veri-model', label: 'Veri & Model', desc: 'Yükleme · Critic Agent', icon: UploadCloud, section: 'Yönetim' },
  { to: '/arsiv', label: 'Arşiv & Raporlar', desc: 'Geçmiş · PDF Rapor', icon: History, section: 'Yönetim' },
];

export default function Layout() {
  const {
    token, handleLogout, downloadReport, systemError, setSystemError,
    showCustomModal, setShowCustomModal, modalTitle, modalContent, reportRef
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  if (!token) return null;

  return (
    <div className="min-h-screen flex blueprint-grid" style={{ background: '#14161A' }}>

      {systemError && (
        <div className="fixed top-0 left-0 right-0 z-[200] px-10 py-5 flex justify-between items-center shadow-2xl" style={{ background: '#2E1616', borderBottom: '1px solid #4A2020' }}>
          <div className="flex items-center gap-6">
            <AlertCircle size={32} color="#D64545" />
            <div>
              <h3 className="font-black uppercase text-xs tracking-widest" style={{ color: '#E8B0A8' }}>{systemError.title}</h3>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#C99C96' }}>{systemError.detail}</p>
            </div>
          </div>
          <button onClick={() => setSystemError(null)} className="px-5 py-2 rounded-xl font-black text-[9px] uppercase" style={{ background: '#D64545', color: '#1C0D0A' }}>Kapat</button>
        </div>
      )}

      {/* SIDEBAR — koyu lacivert tema */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: 'linear-gradient(190deg, #1F2328, #14161A)', borderRight: '1px solid #2A2E34' }}>
        <div className="p-6 flex items-center gap-3 border-b" style={{ borderColor: '#2A2E34' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black" style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' }}>D</div>
          <div>
            <div className="text-lg font-semibold" style={{ color: '#F2EFEA' }}>DecisionOS</div>
            <div className="text-[8.5px] tracking-widest uppercase" style={{ color: '#6A6F76' }}>Kurumsal Karar Zekâsı</div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map((item, index) => {
            const showSection =
              index === 0 ||
              navItems[index - 1].section !== item.section;

            const Icon = item.icon;

            return (
              <div key={item.to}>
                {showSection && (
                  <div className="text-[8.5px] tracking-widest uppercase font-bold px-3 pt-4 pb-2" style={{ color: '#4A4F56' }}>{item.section}</div>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-[12.5px] font-semibold mb-1 transition ${
                      isActive ? 'border-l-2' : 'hover:bg-white/5'
                    }`
                  }
                  style={({ isActive }) => (isActive
                    ? { background: 'rgba(255,107,53,0.12)', color: '#F2EFEA', borderColor: '#FF6B35' }
                    : { color: '#9AA0A8' }
                  )}
                >
                  <Icon size={17} style={{ color: '#FF6B35' }} />
                  <div>
                    {item.label}
                    <span className="block text-[9px] font-normal" style={{ color: '#5C6169' }}>{item.desc}</span>
                  </div>
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="p-5 border-t" style={{ borderColor: '#2A2E34' }}>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 border py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition" style={{ borderColor: '#33383F', color: '#9AA0A8' }}>
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* SAĞ TARAF: topbar + sayfa içeriği */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b px-10 py-5 flex justify-between items-center" style={{ background: '#101214', borderColor: '#2A2E34' }}>
          <div className="text-xl font-semibold" style={{ color: '#F2EFEA' }}>DecisionOS</div>
          <div className="flex items-center gap-3">
            <button onClick={downloadReport} className="text-[10.5px] font-bold uppercase px-4 py-2.5 rounded-lg" style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' }}>
              <Download size={14} className="inline mr-1" /> Rapor Al
            </button>
            <span className="text-[10.5px] font-bold px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ background: 'rgba(95,168,143,0.12)', color: '#5FA88F' }}>
              <ShieldCheck size={14} /> Sistem Canlı
            </span>
          </div>
        </div>

      <div ref={reportRef} className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[300]" style={{ background: 'rgba(5,9,18,0.7)' }}>
          <div className="p-10 rounded-[3rem] shadow-2xl max-w-md w-full mx-4 text-center space-y-6" style={{ background: '#1F2328', border: '1px solid #33383F' }}>
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black" style={{ background: 'rgba(95,168,143,0.12)', color: '#5FA88F' }}>✓</div>
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#F2EFEA' }}>{modalTitle}</h3>
              <p className="text-[10px] font-bold leading-relaxed" style={{ color: '#9AA0A8' }}>{modalContent}</p>
            </div>
            <button onClick={() => setShowCustomModal(false)} className="w-full py-4 rounded-2xl font-black uppercase text-[9px]" style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}