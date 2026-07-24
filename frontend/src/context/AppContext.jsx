import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const baseDataForApi = {
  usdRate: 34.5, steelPrice: 820.0, productionVolume: 1200, salesVolume: 1150,
  laborCost: 28000.0, usdChange: 0.02, steelChange: -0.01, usdMa3: 33.8,
  lastProfit: 85000000.0, lastMargin: 10.5, unitCost: 750000.0, month: 6, netProfit: 85000000.0
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // --- BÜTÜN STATE'LER ---

  // Sürgülerin (Slider) sayfa yenilenince sıfırlanmaması için sessionStorage senkronizasyonu
  const [usdChange, setUsdChange] = useState(() => {
    return Number(sessionStorage.getItem('decisionos_usdChange')) || 0;
  });
  const [steelChange, setSteelChange] = useState(() => {
    return Number(sessionStorage.getItem('decisionos_steelChange')) || 0;
  });
  const [prodChange, setProdChange] = useState(() => {
    return Number(sessionStorage.getItem('decisionos_prodChange')) || 0;
  });

  const [targetProfit, setTargetProfit] = useState(150000000);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [modelAlert, setModelAlert] = useState(null);
  const [systemError, setSystemError] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = sessionStorage.getItem('decisionos_chat');
    return saved ? JSON.parse(saved) : [{ role: 'ai', text: 'Analiz Kurulu yayında. Stratejinizi tartışalım.' }];
  });
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [training, setTraining] = useState(false);

  // İlk yüklenmede API yarış durumunu önlemek için Token'ı anında Axios'a veriyoruz
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('decisionos_token');
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [shapData, setShapData] = useState(null);
  // .env / .env.production dosyasında VITE_API_URL tanımlanmazsa geliştirme
  // için localhost'a düşer. Deploy ederken mutlaka gerçek backend adresini
  // VITE_API_URL olarak ayarla (ör: https://api.decisionos.com/api).
  const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7283/api';
  const reportRef = useRef();
  const [blindSpots, setBlindSpots] = useState([]);

  // --- EXECUTIVE REPORT STATE'LERİ ---
  const [executiveReport, setExecutiveReport] = useState(() => {
    return sessionStorage.getItem('decisionos_executive_report') || null;
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  // --- SÜRGÜLERİN DEĞERLERİNİ DEPOLAMA EFFECTLERİ ---
  useEffect(() => {
    sessionStorage.setItem('decisionos_usdChange', usdChange);
  }, [usdChange]);

  useEffect(() => {
    sessionStorage.setItem('decisionos_steelChange', steelChange);
  }, [steelChange]);

  useEffect(() => {
    sessionStorage.setItem('decisionos_prodChange', prodChange);
  }, [prodChange]);

  // --- BÜTÜN FONKSİYONLAR ---
  const triggerCustomAlert = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setShowCustomModal(true);
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, loginForm);
      localStorage.setItem('decisionos_token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setToken(res.data.token);
    } catch (err) {
      setLoginError("Kullanıcı adı veya şifre hatalı.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('decisionos_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    sessionStorage.removeItem('decisionos_chat');
    setChatHistory([{ role: 'ai', text: 'Analiz Kurulu yayında. Stratejinizi tartışalım.' }]);
  };

  const handleForceApprove = async () => {
    try {
      const res = await axios.post(`${API_URL}/financial/approve-model`, true);
      triggerCustomAlert("🎯 CFO Onayı Başarılı", res.data.message);
      setModelAlert(null);
      fetchHistory();
    } catch (err) {
      triggerCustomAlert("❌ İşlem Başarısız", "Model onaylanırken bir hata oluştu. Lütfen bağlantıları kontrol edin.");
    }
  };

  // 1. DEĞİŞİKLİK: 401 hatasını önlemek için token kontrolü ve bağımlılığı eklendi
  const fetchHistory = useCallback(async () => {
    if (!token) return; // Giriş yapılmadıysa istek atma
    try {
      const response = await axios.get(`${API_URL}/financial/history`);
      setHistory(response.data || []);
    } catch (err) {
      console.error("Veritabanı hatası", err);
      setSystemError({
        title: "Veritabanı Bağlantı Hatası",
        detail: "Geçmiş senaryo verileri sunucudan alınamadı. Backend servisi (API) çalışmıyor olabilir."
      });
    }
  }, [API_URL, token]);

  // 2. DEĞİŞİKLİK: 401 hatasını önlemek için token kontrolü ve bağımlılığı eklendi
  const runSimulation = useCallback(async () => {
    if (!token) return; // Giriş yapılmadıysa istek atma
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/financial/simulate`, {
        baseData: baseDataForApi, usdChange: usdChange / 100, steelChange: steelChange / 100, productionChange: prodChange / 100
      });
      setResult(response.data);
      fetchHistory();
    } catch (err) {
      console.error("Sim Error", err);
      setSystemError({
        title: "Simülasyon Motoru Hatası",
        detail: "API'den simülasyon sonucu alınamadı. Lütfen backend bağlantısını kontrol edin."
      });
    } finally { setLoading(false); }
  }, [usdChange, steelChange, prodChange, API_URL, fetchHistory, token]);

  // 3. DEĞİŞİKLİK: 401 hatasını önlemek için token kontrolü ve bağımlılığı eklendi
  const fetchExplanation = useCallback(async () => {
    if (!token) return; // Giriş yapılmadıysa istek atma
    try {
      const response = await axios.post(`${API_URL}/financial/explain`, {
        baseData: baseDataForApi,
        usdChange: usdChange / 100,
        steelChange: steelChange / 100,
        productionChange: prodChange / 100
      });
      setShapData(response.data);
    } catch (err) {
      console.error("SHAP Error", err);
    }
  }, [usdChange, steelChange, prodChange, API_URL, token]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/financial/optimize`, {
        baseData: baseDataForApi, targetProfit: targetProfit
      });
      const plan = res.data;
      setUsdChange(Math.round(plan.usdChange || 0));
      setSteelChange(Math.round(plan.steelChange || 0));
      setProdChange(Math.round(plan.productionChange || 0));
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: `🎯 HEDEF ANALİZİ: ${targetProfit.toLocaleString()} TL kâr hedefi için optimize strateji:\n• Kur: %${Math.round(plan.usdChange)} \n• Çelik: %${Math.round(plan.steelChange)} \n• Üretim: %${Math.round(plan.productionChange)}`
      }]);
    } catch (err) {
      setSystemError({
        title: "Strateji Optimizasyonu Hatası",
        detail: "Hedef kâr için optimum senaryo hesaplanamadı. Backend bağlantısını kontrol edin."
      });
    } finally { setLoading(false); }
  };

  const saveToSlot = (slot) => {
    if (!result) return;
    const snapshot = {
      profit: result.simulatedProfit,
      impact: result.impactPct,
      settings: { usd: usdChange, steel: steelChange, prod: prodChange }
    };
    if (slot === 'A') setScenarioA(snapshot); else setScenarioB(snapshot);
    setChatHistory(prev => [...prev, { role: 'ai', text: `📌 Senaryo ${slot} kilitlendi.` }]);
  };

  const handleChat = async () => {
    if (!chatMessage || !result) return;
    const userMsg = { role: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    try {
      const res = await axios.post(`${API_URL}/financial/chat`, { user_query: chatMessage, sim_context: result });
      if (res.data.action) {
        const act = res.data.action;
        if (act.usd_change !== 0) setUsdChange(Math.round(act.usd_change * 100));
        if (act.steel_change !== 0) setSteelChange(Math.round(act.steel_change * 100));
      }
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      console.error("Chat Error", err);
      setSystemError({
        title: "AI Analiz Kurulu Hatası",
        detail: "Sohbet servisine ulaşılamadı. Backend bağlantısını kontrol edin."
      });
    }
  };

  // --- EXECUTIVE REPORT OLUŞTURMA FONKSİYONU ---
  const fetchExecutiveReport = async () => {
    if (!result) return;
    setGeneratingReport(true);
    setExecutiveReport(null);
    try {
      const response = await axios.post(`${API_URL}/financial/executive-report`, {
        sim_context: result,
        target_profit: targetProfit
      });
      setExecutiveReport(response.data.report);
    } catch (err) {
      console.error("Report API Error", err);
      triggerCustomAlert("❌ Rapor Hatası", "Yönetici raporu oluşturulurken teknik bir sorun oluştu.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async () => {
    const node = reportRef.current;
    if (!node) return;
    const { toPng } = await import('html-to-image');
    const { default: jsPDF } = await import('jspdf');

    const scrollables = node.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [class*="h-[380px]"]');
    const originalStyles = [];
    scrollables.forEach((el) => {
      originalStyles.push({ el, overflow: el.style.overflow, maxHeight: el.style.maxHeight, height: el.style.height, width: el.style.width, flex: el.style.flex });
      el.style.overflow = 'visible'; el.style.maxHeight = 'none'; el.style.height = 'auto'; el.style.width = 'auto'; el.style.flex = 'none';
    });

    try {
      const dataUrl = await toPng(node, { backgroundColor: '#F6F4EF', pixelRatio: 2 });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pageWidth = 210;
      const imgHeightInPdf = (img.height * pageWidth) / img.width;

      const pdf = new jsPDF('p', 'mm', [pageWidth, imgHeightInPdf]);
      pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, imgHeightInPdf);

      pdf.save("DecisionOS_Stratejik_Rapor.pdf");
    } finally {
      originalStyles.forEach(({ el, overflow, maxHeight, height, width, flex }) => {
        el.style.overflow = overflow; el.style.maxHeight = maxHeight; el.style.height = height; el.style.width = width; el.style.flex = flex;
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(file, {
        header: true, dynamicTyping: true, skipEmptyLines: true,
        complete: async (results) => {
          setTraining(true);
          try {
            const cleanData = results.data.filter(row => row.usdRate || row.USD_TRY);
            const res = await axios.post(`${API_URL}/financial/train`, cleanData);
            setBlindSpots(res.data.blindSpots || []);
            if (res.data.isAnomaly || res.data.is_anomaly) {
              setModelAlert(res.data);
            } else {
              triggerCustomAlert("🎯 Model Güncellendi", `İyileşme: %${res.data.improvement_pct || 0}`);
              setModelAlert(null);
            }
            fetchHistory();
          } catch (err) {
            console.error(err);
            setSystemError({ title: "Model Eğitimi (AutoML) Hatası", detail: "Yüklenen veri seti işlenemedi veya eğitim servisine ulaşılamadı." });
          } finally { setTraining(false); }
        }
      });
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/financial/upload-pdf`, formData);
      triggerCustomAlert("✅ Hafıza Güncellendi", "Belge başarıyla işlendi ve AI hafızasına eklendi.");
    } catch (err) {
      console.error(err);
      setSystemError({ title: "Belge Yükleme Hatası", detail: "PDF belgesi sunucuya gönderilemedi. Backend bağlantısını kontrol edin." });
    }
  };

  // E-posta ile Kayıt Olma Fonksiyonu
  const handleRegister = async (username, email, password) => {
    setLoginError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      triggerCustomAlert("🎯 Kayıt Başarılı", res.data.message || "Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.");
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Kayıt sırasında bir hata oluştu.";
      setLoginError(errorMsg);
      return false;
    }
  };

  // Şifremi Unuttum Mail İsteme Fonksiyonu
  const handleForgotPassword = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      triggerCustomAlert("✉️ E-posta Gönderildi", res.data.message);
      return true;
    } catch (err) {
      triggerCustomAlert("❌ Hata", err.response?.data?.message || "İşlem gerçekleştirilemedi.");
      return false;
    }
  };

  // Yeni Şifreyi Kaydetme Fonksiyonu
  const handleResetPassword = async (token, newPassword) => {
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      triggerCustomAlert("🎉 Başarılı", res.data.message);
      return true;
    } catch (err) {
      triggerCustomAlert("❌ Hata", err.response?.data?.message || "Şifre güncellenemedi.");
      return false;
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
      fetchExplanation();
    }, 600);
    return () => clearTimeout(timer);
  }, [runSimulation, fetchExplanation]);

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('decisionos_token');
          setToken(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    sessionStorage.setItem('decisionos_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (executiveReport) {
      sessionStorage.setItem('decisionos_executive_report', executiveReport);
    } else {
      sessionStorage.removeItem('decisionos_executive_report');
    }
  }, [executiveReport]);

  const chartData = result
    ? [{ name: 'Mevcut', profit: result.originalProfit || 0 }, { name: 'Senaryo', profit: result.simulatedProfit || 0 }]
    : [];

  // --- Her şeyi Context üzerinden dışarı veriyoruz ---
  const value = {
    usdChange, setUsdChange, steelChange, setSteelChange, prodChange, setProdChange,
    targetProfit, setTargetProfit, result, history, modelAlert, setModelAlert,
    systemError, setSystemError, chatMessage, setChatMessage, chatHistory,
    scenarioA, setScenarioA, scenarioB, setScenarioB,
    showCustomModal, setShowCustomModal, modalTitle, modalContent,
    loading, loginError, training, token, loginForm, setLoginForm,
    reportRef, chartData, shapData, blindSpots,
    executiveReport, generatingReport, fetchExecutiveReport,
    handleLogin, handleLogout, handleForceApprove, handleOptimize,
    saveToSlot, handleChat, downloadReport, handleFileUpload, handlePdfUpload,
    triggerCustomAlert,

    // TÜM METOTLAR PROVİDER DEĞERİ OLARAK DIŞARI VERİLDİ:
    handleRegister,
    handleForgotPassword,
    handleResetPassword
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}