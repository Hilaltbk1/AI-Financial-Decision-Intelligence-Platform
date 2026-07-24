import { useApp } from '../context/AppContext';
import DOMPurify from 'dompurify'; // DOMPurify import edildi
import { Settings2, Target, DollarSign, Split, XCircle, FileText, Download, RotateCw, Cpu } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, ReferenceLine
} from 'recharts';

const COLORS = ['#FF6B35', '#6E8CAE', '#5FA88F', '#868C93'];

export default function ScenarioPage() {
  const {
    usdChange, setUsdChange, steelChange, setSteelChange, prodChange, setProdChange,
    targetProfit, setTargetProfit, handleOptimize, saveToSlot,
    scenarioA, setScenarioA, scenarioB, setScenarioB,
    result, chartData, loading, shapData,
    executiveReport, generatingReport, fetchExecutiveReport, downloadReport, reportRef
  } = useApp();

  // --- Senaryo Karşılaştırma verisini hazırla ---
  const comparisonData = [
    {
      metric: 'Net Kâr (TL)',
      A: scenarioA?.profit || 0,
      B: scenarioB?.profit || 0,
    },
    {
      metric: 'Varyans (%)',
      A: scenarioA?.impact || 0,
      B: scenarioB?.impact || 0,
    },
  ];
  const hasComparison = scenarioA || scenarioB;

  console.log("SHAP DATA:", shapData);
  // --- SHAP Waterfall verisini hazırla ---
  const waterfallData = shapData
    ? [...shapData.contributions]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 8)
    : [];

  return (
    <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-10">
      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl border space-y-8 p-8" style={{ background: '#1F2328', borderColor: '#33383F' }}>
          <h2 className="font-black uppercase flex items-center gap-2 text-xs tracking-widest border-b pb-4" style={{ color: '#F2EFEA', borderColor: '#33383F' }}>
            <Settings2 size={18} /> Senaryo Parametreleri
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between font-black" style={{ color: '#D8D4CC' }}><span>Kur</span><span style={{ color: '#FF6B35' }}>%{usdChange}</span></div>
            <input type="range" min="-20" max="100" value={usdChange} onChange={(e) => setUsdChange(Number(e.target.value))} className="w-full accent-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between font-black" style={{ color: '#D8D4CC' }}><span>Çelik</span><span style={{ color: '#FF6B35' }}>%{steelChange}</span></div>
            <input type="range" min="-40" max="80" value={steelChange} onChange={(e) => setSteelChange(Number(e.target.value))} className="w-full accent-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between font-black" style={{ color: '#D8D4CC' }}><span>Üretim</span><span style={{ color: '#FF6B35' }}>%{prodChange}</span></div>
            <input type="range" min="-50" max="50" value={prodChange} onChange={(e) => setProdChange(Number(e.target.value))} className="w-full accent-orange-500" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => saveToSlot('A')} className="flex-1 py-3 rounded-xl font-black uppercase text-[9px]" style={{ background: 'rgba(110,140,174,0.15)', color: '#9DB8D6' }}>Kilit A</button>
            <button onClick={() => saveToSlot('B')} className="flex-1 py-3 rounded-xl font-black uppercase text-[9px]" style={{ background: 'rgba(214,69,69,0.14)', color: '#D64545' }}>Kilit B</button>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(160deg,#23272D,#101214)', border: '1px solid #33383F' }}>
            <p className="text-[9px] font-black uppercase mb-3 flex items-center gap-2" style={{ color: '#FF6B35' }}><Target size={14} /> Goal-Seek</p>
            <input type="number" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} className="w-full rounded-xl px-4 py-3 mb-3 outline-none font-black" style={{ background: 'rgba(255,255,255,0.06)', color: '#F2EFEA' }} />
            <button onClick={handleOptimize} className="w-full py-3 rounded-xl font-black uppercase text-[10px]" style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' }}>Strateji Oluştur</button>
          </div>
        </div>

        {(scenarioA || scenarioB) && (
          <div className="space-y-4">
            {scenarioA && (
              <div className="p-6 rounded-2xl relative" style={{ background: 'linear-gradient(160deg,#232B36,#1F2328)', border: '1px solid #3A4552' }}>
                <button onClick={() => setScenarioA(null)} className="absolute top-3 right-3" style={{ color: 'rgba(255,255,255,0.4)' }}><XCircle size={18} /></button>
                <p className="text-[9px] font-black uppercase mb-2 flex items-center gap-1" style={{ color: '#9DB8D6' }}><Split size={12} /> Opsiyon A</p>
                <h4 className="text-2xl font-black" style={{ color: '#F2EFEA' }}>{scenarioA.profit?.toLocaleString()} TL</h4>
              </div>
            )}
            {scenarioB && (
              <div className="p-6 rounded-2xl relative" style={{ background: 'linear-gradient(160deg,#3A1B16,#1C0D0A)', border: '1px solid #5C2A22' }}>
                <button onClick={() => setScenarioB(null)} className="absolute top-3 right-3" style={{ color: 'rgba(255,255,255,0.4)' }}><XCircle size={18} /></button>
                <p className="text-[9px] font-black uppercase mb-2 flex items-center gap-1" style={{ color: '#D64545' }}><Split size={12} /> Opsiyon B</p>
                <h4 className="text-2xl font-black" style={{ color: '#F2EFEA' }}>{scenarioB.profit?.toLocaleString()} TL</h4>
              </div>
            )}
          </div>
        )}

        {hasComparison && (
          <div className="rounded-3xl border p-6" style={{ background: '#1F2328', borderColor: '#33383F' }}>
            <h4 className="font-black uppercase text-[10px] mb-6 text-center" style={{ color: '#8A8F98' }}>
              Senaryo Karşılaştırma
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-center text-[9px] font-bold mb-2" style={{ color: '#8A8F98' }}>Net Kâr (TL)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[{ name: 'Kâr', A: scenarioA?.profit || 0, B: scenarioB?.profit || 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2E34" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 'dataMax + 2000000']} />
                    <ReferenceLine y={0} stroke="#4A4F56" strokeWidth={1.5} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #33383F', background: '#101214', fontSize: '11px', color: '#F2EFEA' }}
                      formatter={(value) => '%' + value.toFixed(2)}
                    />
                    <Bar dataKey="A" name="Opsiyon A" fill="#6E8CAE" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="B" name="Opsiyon B" fill="#FF6B35" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-center text-[9px] font-bold mb-2" style={{ color: '#8A8F98' }}>Varyans (%)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[{ name: 'Varyans', A: scenarioA?.impact || 0, B: scenarioB?.impact || 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2E34" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #33383F', background: '#101214', fontSize: '11px', color: '#F2EFEA' }}
                      formatter={(value) => '%' + value.toFixed(2)}
                    />
                    <Bar dataKey="A" name="Opsiyon A" fill="#6E8CAE" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="B" name="Opsiyon B" fill="#FF6B35" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-4">
              <span className="flex items-center gap-2 text-[10px] font-bold" style={{ color: '#8A8F98' }}>
                <span className="w-3 h-3 rounded" style={{ background: '#6E8CAE' }}></span> Opsiyon A
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold" style={{ color: '#8A8F98' }}>
                <span className="w-3 h-3 rounded" style={{ background: '#FF6B35' }}></span> Opsiyon B
              </span>
            </div>
          </div>
        )}
      </aside>

      <main className="lg:col-span-8 space-y-6">
        <div className="rounded-3xl border p-8 blueprint-corners" style={{ background: '#1F2328', borderColor: '#33383F' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35' }}><DollarSign size={28} /></div>
            {result && <div className="px-4 py-2 rounded-full font-black text-[11px]" style={{ background: result.impactPct >= 0 ? 'rgba(95,168,143,0.14)' : 'rgba(214,69,69,0.14)', color: result.impactPct >= 0 ? '#5FA88F' : '#D64545' }}>%{result.impactPct?.toFixed(2)}</div>}
          </div>
          <p className="font-black uppercase text-[9px] mb-2" style={{ color: '#8A8F98' }}>Net Kâr Tahmini</p>
          <h3 className="text-4xl font-black" style={{ color: '#F2EFEA' }}>{(result?.simulatedProfit || 0).toLocaleString()} TL</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border p-6 text-center" style={{ background: '#1F2328', borderColor: '#33383F' }}>
            <h4 className="font-black uppercase text-[10px] mb-6" style={{ color: '#8A8F98' }}>Kâr Varyansı</h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2E34" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#8A8F98' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #33383F', background: '#101214', fontSize: '11px', color: '#F2EFEA' }} />
                <Bar dataKey="profit" radius={[10, 10, 10, 10]} barSize={40}>
                  {chartData.map((e, i) => <Cell key={i} fill={i === 1 ? '#FF6B35' : '#3A3F46'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border p-6 text-center" style={{ background: '#1F2328', borderColor: '#33383F' }}>
            <h4 className="font-black uppercase text-[10px] mb-6" style={{ color: '#8A8F98' }}>Neden Analizi</h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={result?.driverData || []} innerRadius={40} outerRadius={60} paddingAngle={6} dataKey="value" stroke="none">
                  {result?.driverData?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #33383F', background: '#101214', fontSize: '11px', color: '#F2EFEA' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', color: '#8A8F98' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- DİJİTAL İKİZ (DIGITAL TWIN) VE SÜREÇ AKIŞ ŞEMASI --- */}
        {result && (
          <div className="rounded-3xl border space-y-6 p-8" style={{ background: '#1F2328', borderColor: '#33383F' }}>
            <h4 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 border-b pb-4" style={{ color: '#F2EFEA', borderColor: '#33383F' }}>
              <Cpu size={16} className="animate-spin" style={{ animationDuration: '4s' }} /> FABRİKA DİJİTAL İKİZİ VE SÜREÇ AKIŞ ŞEMASI
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

              {/* Bölüm 1: Girdiler (Canlı Hesaplamalar) */}
              <div className="space-y-3 flex flex-col justify-between">
                {/* Çelik / Hammadde Girişi */}
                <div className="p-4 rounded-2xl border transition-all duration-300 hover:shadow-md" style={{ borderColor: '#3A2E1C', background: '#241C14' }}>
                  <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#FF6B35' }}>Hammadde Girdisi</p>
                  <h5 className="font-bold text-xs mt-1" style={{ color: '#F2EFEA' }}>{(result.simulatedSteelPrice || 820).toLocaleString()} USD / Ton</h5>
                  <p className="text-[10px] font-medium mt-1" style={{ color: '#868C93' }}>Birim Yük: <span className="font-mono" style={{ color: '#D8D4CC' }}>{(result.simulatedMaterialCost || 0).toLocaleString()} TL</span></p>
                </div>

                {/* İşçilik Gücü */}
                <div className="p-4 rounded-2xl border transition-all duration-300 hover:shadow-md" style={{ borderColor: '#24413B', background: '#0F1D19' }}>
                  <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#5FA88F' }}>İşçilik Girdisi</p>
                  <h5 className="font-bold text-xs mt-1" style={{ color: '#F2EFEA' }}>Kur Hassasiyetli İş Gücü</h5>
                  <p className="text-[10px] font-medium mt-1" style={{ color: '#868C93' }}>Birim Yük: <span className="font-mono" style={{ color: '#D8D4CC' }}>{(result.simulatedLaborCost || 0).toLocaleString()} TL</span></p>
                </div>

                {/* Enerji Girişi */}
                <div className="p-4 rounded-2xl border transition-all duration-300 hover:shadow-md" style={{ borderColor: '#2E3742', background: '#171B1F' }}>
                  <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#6E8CAE' }}>Enerji Girdisi</p>
                  <h5 className="font-bold text-xs mt-1" style={{ color: '#F2EFEA' }}>Enerji Endeksi: 2.8</h5>
                  <p className="text-[10px] font-medium mt-1" style={{ color: '#868C93' }}>Birim Yük: <span className="font-mono" style={{ color: '#D8D4CC' }}>{(result.simulatedEnergyCost || 0).toLocaleString()} TL</span></p>
                </div>
              </div>

              {/* Bölüm 2: Üretim Hattı / Dijital İkiz Ünitesi */}
              <div className="flex flex-col items-center justify-center relative py-6 md:py-0">
                <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 hidden md:block text-lg" style={{ color: '#4A4F56' }}>➔</div>
                <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 hidden md:block text-lg" style={{ color: '#4A4F56' }}>➔</div>

                <div className="w-full p-6 rounded-3xl border-4 text-center space-y-4 relative overflow-hidden transition-all duration-500 hover:shadow-xl"
                     style={{ borderColor: '#FF6B35', background: '#241C14', boxShadow: '0 10px 30px -15px rgba(232, 147, 91, 0.25)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto animate-pulse text-[10px]" style={{ background: 'rgba(255,107,53,0.18)', color: '#FF6B35' }}>⚙</div>
                  <div>
                    <p className="text-[8px] font-black uppercase" style={{ color: '#FF6B35' }}>Haddehane Proses Ünitesi</p>
                    <h5 className="font-black text-xl mt-1" style={{ color: '#F2EFEA' }}>{(result.productionVolume || 1200).toLocaleString()} Ton</h5>
                    <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: 'rgba(255,107,53,0.2)' }}>
                      <p className="text-[9px] font-black uppercase" style={{ color: '#868C93' }}>Maliyet / Birim</p>
                      <p className="font-mono font-black text-sm mt-0.5" style={{ color: '#F2EFEA' }}>{(result.simulatedUnitCost || 0).toLocaleString()} TL</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bölüm 3: Finansal Sonuç / Kar Çıktısı */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-full p-6 rounded-3xl text-center space-y-3 transition-all duration-500 hover:shadow-xl"
                     style={{ background: 'linear-gradient(165deg,#23272D,#101214)', border: '1px solid #33383F', boxShadow: '0 10px 35px -15px rgba(0,0,0,0.5)' }}>
                  <div className="text-xl">💰</div>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#FF6B35' }}>Net Finansal Sonuç</p>
                  <h5 className="font-mono font-black text-base" style={{ color: '#F2EFEA' }}>{(result.simulatedProfit || 0).toLocaleString()} TL</h5>
                  <div className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase mt-1"
                       style={{ background: result.impactPct >= 0 ? 'rgba(95,168,143,0.14)' : 'rgba(214,69,69,0.14)', color: result.impactPct >= 0 ? '#5FA88F' : '#D64545' }}>
                    {result.impactPct >= 0 ? '▲' : '▼'} %{Math.abs(result.impactPct).toFixed(2)}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- AI EXECUTIVE ADVISOR RAPOR ALANI --- */}
        <div className="rounded-3xl border p-8 space-y-6" style={{ background: '#1F2328', borderColor: '#33383F' }}>
          <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: '#33383F' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35' }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: '#F2EFEA' }}>
                  AI Executive Advisor
                </h3>
                <p className="text-[10px] font-semibold" style={{ color: '#8A8F98' }}>
                  CFO ve Yönetim Kurulu Karar Destek Raporu
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchExecutiveReport}
                disabled={generatingReport}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:opacity-95 disabled:opacity-50"
                style={{ background: 'rgba(110,140,174,0.15)', color: '#9DB8D6' }}
              >
                <RotateCw size={12} className={generatingReport ? "animate-spin" : ""} />
                {generatingReport ? "Hazırlanıyor..." : "Rapor Oluştur"}
              </button>
              {executiveReport && (
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:opacity-95"
                  style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' }}
                >
                  <Download size={12} />
                  PDF İndir
                </button>
              )}
            </div>
          </div>

          {/* Raporun Ekranda Render Edileceği ve Screenshot Alınacağı Bölge */}
          {generatingReport && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-dashed animate-spin" style={{ borderColor: '#FF6B35' }} />
              <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#8A8F98' }}>
                Yapay Zeka Finansal Senaryoları ve Kurumsal Hafızayı Analiz Ediyor...
              </p>
            </div>
          )}

          {!generatingReport && !executiveReport && (
            <div className="py-10 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: '#33383F' }}>
              <p className="text-[11px] font-semibold italic" style={{ color: '#8A8F98' }}>
                Henüz yönetici raporu oluşturulmadı. Yukarıdaki "Rapor Oluştur" butonuna basarak CFO seviyesinde analiz edinin.
              </p>
            </div>
          )}

          {executiveReport && (
            <div
              ref={reportRef}
              className="p-8 rounded-2xl shadow-sm border space-y-4"
              style={{ background: '#101214', borderColor: '#33383F' }}
            >
              {/* PDF Header (Sadece PDF kaydında resmi görünmesi için şık bir üst bilgi) */}
              <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: '#33383F' }}>
                <span className="italic font-black text-base" style={{ color: '#F2EFEA' }}>
                  DecisionOS Executive Strategy
                </span>
                <span className="font-mono text-[9px] font-bold" style={{ color: '#8A8F98' }}>
                  TARİH: {new Date().toLocaleDateString("tr-TR")}
                </span>
              </div>

              {/* Gelen HTML Raporunun Güvenli Şekilde Render Edilmesi */}
              <div
                className="prose prose-sm prose-invert max-w-none text-left"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(executiveReport) }} // DOMPurify ile koruma sağlandı
              />
            </div>
          )}
        </div>

        {shapData && (
          <div
            className="rounded-3xl border p-6"
            style={{ background: '#1F2328', borderColor: '#33383F' }}
          >
            <h4
              className="font-black uppercase text-[10px] mb-2 text-center"
              style={{ color: "#8A8F98" }}
            >
              Model Açıklanabilirliği
            </h4>

            <p
              className="text-center text-[10px] mb-6"
              style={{ color: "#5C6169" }}
            >
              Taban Değer:
              <b style={{ color: '#868C93' }}> {shapData.baseValue.toLocaleString("tr-TR")} TL </b>
              →
              Tahmin:
              <b style={{ color: '#868C93' }}> {shapData.prediction.toLocaleString("tr-TR")} TL</b>
            </p>

            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={waterfallData}
                layout="vertical"
                margin={{
                  left: 30,
                  right: 30
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2A2E34"
                />
                <XAxis
                  type="number"
                  tick={{ fill: '#8A8F98' }}
                  tickFormatter={(v) =>
                    `${(v / 1000).toFixed(0)}K`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={140}
                  tick={{
                    fontSize: 11,
                    fontWeight: 700,
                    fill: '#D8D4CC'
                  }}
                />
                <ReferenceLine
                  x={0}
                  stroke="#4A4F56"
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #33383F', background: '#101214', fontSize: '11px', color: '#F2EFEA' }}
                  formatter={(value) => [
                    Number(value).toLocaleString("tr-TR") + " TL",
                    "SHAP Etkisi"
                  ]}
                />
                <Bar
                  dataKey="value"
                  radius={[5, 5, 5, 5]}
                >
                  {waterfallData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.value >= 0
                          ? "#5FA88F"
                          : "#D64545"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-8 mt-5">
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#D8D4CC' }}>
                <div
                  className="w-3 h-3 rounded"
                  style={{ background: "#5FA88F" }}
                />
                Kârı Artıran
              </div>
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#D8D4CC' }}>
                <div
                  className="w-3 h-3 rounded"
                  style={{ background: "#D64545" }}
                />
                Kârı Azaltan
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}