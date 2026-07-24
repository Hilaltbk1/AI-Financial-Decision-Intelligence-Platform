import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, PackageSearch, History as HistoryIcon, Settings2, BrainCircuit } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function DashboardPage() {
  const { result, history, chartData, shapData } = useApp();
  const navigate = useNavigate();

  const originalProfit = result?.originalProfit || 0;
  const simulatedProfit = result?.simulatedProfit || 0;
  const impactPct = result?.impactPct || 0;
  const unitCost = result?.simulatedUnitCost || 0;
  const topFactor = shapData?.contributions?.[0] || null;

  return (
    <div className="p-10 max-w-[1500px] mx-auto space-y-6">

      <div className="mb-2">
        <h1 className="font-black text-2xl" style={{ color: "#F2EFEA" }}>
          Genel Bakış
        </h1>
        <p className="text-[12px] font-semibold" style={{ color: "#8A8F98" }}>
          Şirketin güncel finansal durumu, tek bakışta
        </p>
      </div>

      {/* --- MODEL AÇIKLANABİLİRLİĞİ (GENİŞ BANNER) --- */}
      {topFactor && (
        <div
          className="rounded-2xl border p-5 flex items-center justify-between blueprint-corners"
          style={{
            borderColor: topFactor.value >= 0 ? "#24413B" : "#4A2020",
            background: topFactor.value >= 0 ? "rgba(95,168,143,0.06)" : "rgba(214,69,69,0.06)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
              style={{
                background: topFactor.value >= 0 ? "rgba(95,168,143,0.14)" : "rgba(214,69,69,0.14)",
                color: topFactor.value >= 0 ? "#5FA88F" : "#D64545",
              }}
            >
              {topFactor.value >= 0 ? "▲" : "▼"}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A8F98" }}>
                Model Açıklanabilirliği — En Etkili Faktör
              </p>
              <p className="font-bold text-sm mt-1" style={{ color: "#F2EFEA" }}>
                {topFactor.feature}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="font-mono font-black text-lg"
              style={{ color: topFactor.value >= 0 ? "#5FA88F" : "#D64545" }}
            >
              {topFactor.value >= 0 ? "+" : ""}
              {topFactor.value.toLocaleString("tr-TR")} TL
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#8A8F98" }}>
              son tahmine katkısı
            </p>
          </div>
        </div>
      )}

      {/* --- KPI ŞERİDİ --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Kâr Tahmini */}
        <div className="rounded-2xl border p-5" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A8F98" }}>
              Net Kâr Tahmini
            </span>
            <span className="w-2 h-2 rounded-full" style={{ background: "#FF6B35" }} />
          </div>
          <div className="font-mono text-lg font-bold" style={{ color: "#F2EFEA" }}>
            {simulatedProfit.toLocaleString()} TL
          </div>
          <div
            className="text-[10px] font-bold mt-1 flex items-center gap-1"
            style={{ color: impactPct >= 0 ? "#5FA88F" : "#D64545" }}
          >
            <TrendingUp size={12} /> {impactPct >= 0 ? "▲" : "▼"} %{Math.abs(impactPct).toFixed(2)}
          </div>
        </div>

        {/* Orijinal Kâr */}
        <div className="rounded-2xl border p-5" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A8F98" }}>
              Orijinal Kâr
            </span>
            <span className="w-2 h-2 rounded-full" style={{ background: "#6E8CAE" }} />
          </div>
          <div className="font-mono text-lg font-bold" style={{ color: "#F2EFEA" }}>
            {originalProfit.toLocaleString()} TL
          </div>
          <div className="text-[10px] font-bold mt-1" style={{ color: "#8A8F98" }}>Baz senaryo</div>
        </div>

        {/* Birim Maliyet */}
        <div className="rounded-2xl border p-5" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A8F98" }}>
              Birim Maliyet
            </span>
            <span className="w-2 h-2 rounded-full" style={{ background: "#5FA88F" }} />
          </div>
          <div className="font-mono text-lg font-bold" style={{ color: "#F2EFEA" }}>
            {unitCost.toLocaleString()} TL
          </div>
          <div className="text-[10px] font-bold mt-1" style={{ color: "#8A8F98" }}>Verimlilik göstergesi</div>
        </div>

        {/* Toplam Senaryo Kaydı */}
        <div className="rounded-2xl border p-5" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A8F98" }}>
              Toplam Senaryo Kaydı
            </span>
            <span className="w-2 h-2 rounded-full" style={{ background: "#C1440E" }} />
          </div>
          <div className="font-mono text-lg font-bold" style={{ color: "#F2EFEA" }}>
            {history.length}
          </div>
          <div className="text-[10px] font-bold mt-1" style={{ color: "#8A8F98" }}>Arşivde kayıtlı</div>
        </div>
      </div>

      {/* --- KÂR VARYANSI + SON AKTİVİTE --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-3xl border p-8" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10.5px] font-black uppercase tracking-widest" style={{ color: "#F2EFEA" }}>
              Kâr Varyansı — Son Senaryo
            </h3>
            <div className="p-2 rounded-xl" style={{ background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="flex items-end justify-center gap-10 h-[140px]">
            {chartData.map((d, i) => {
              const max = Math.max(...chartData.map((c) => Number(c.profit) || 0), 1);
              const heightPx = ((Number(d.profit) || 0) / max) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 rounded-t-lg"
                    style={{
                      height: `${heightPx}px`,
                      background: i === 1 ? "linear-gradient(180deg,#FF6B35,#C1440E)" : "#3A3F46",
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-[9px] font-black uppercase" style={{ color: "#8A8F98" }}>
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border p-8" style={{ background: "#1F2328", borderColor: "#33383F" }}>
          <h3 className="text-[10.5px] font-black uppercase tracking-widest mb-6" style={{ color: "#F2EFEA" }}>
            Son Aktivite
          </h3>
          <div className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-[11px] py-3 border-b"
                style={{ borderColor: "#2A2E34" }}
              >
                <span className="flex items-center gap-2 font-semibold" style={{ color: "#D8D4CC" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B35" }} />
                  Simülasyon kaydı
                </span>
                <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>
                  {new Date(h.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-[11px] italic" style={{ color: "#8A8F98" }}>
                Henüz kayıtlı bir aktivite yok.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- HIZLI ERİŞİM KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-8 flex justify-between items-center relative overflow-hidden"
          style={{ background: "linear-gradient(165deg,#23272D,#101214)", border: "1px solid #33383F" }}
        >
          <div>
            <p className="font-black text-base mb-1" style={{ color: "#F2EFEA" }}>
              Yeni bir senaryo mu deneyeceksiniz?
            </p>
            <p className="text-[11px]" style={{ color: "#9AA0A8" }}>
              Kur, çelik ve üretim parametrelerini ayarlayın
            </p>
          </div>
          <button
            onClick={() => navigate("/senaryo")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10.5px] uppercase whitespace-nowrap"
            style={{ background: "linear-gradient(150deg,#FF6B35,#C1440E)", color: "#1A1300" }}
          >
            <Settings2 size={14} /> Çalışma Alanına Git
          </button>
        </div>

        <div
          className="rounded-3xl p-8 flex justify-between items-center relative overflow-hidden"
          style={{ background: "linear-gradient(165deg,#23272D,#101214)", border: "1px solid #33383F" }}
        >
          <div>
            <p className="font-black text-base mb-1" style={{ color: "#F2EFEA" }}>
              AI Kurulu'na danışın
            </p>
            <p className="text-[11px]" style={{ color: "#9AA0A8" }}>
              Stratejik yorumlar ve öneriler alın
            </p>
          </div>
          <button
            onClick={() => navigate("/sohbet")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10.5px] uppercase whitespace-nowrap"
            style={{ background: "linear-gradient(150deg,#FF6B35,#C1440E)", color: "#1A1300" }}
          >
            <BrainCircuit size={14} /> Sohbeti Aç
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate("/arsiv")}
        className="w-full rounded-2xl border p-5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest hover:shadow-md transition"
        style={{ background: "#1F2328", borderColor: "#33383F", color: "#F2EFEA" }}
      >
        <HistoryIcon size={16} /> Tüm Senaryo Arşivini Görüntüle
      </button>
    </div>
  );
}