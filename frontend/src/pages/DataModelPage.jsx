import { AlertCircle, FileText, UploadCloud } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function DataModelPage() {
 const { modelAlert, setModelAlert, handleForceApprove, handleFileUpload, handlePdfUpload, training, blindSpots } = useApp();
  return (
    <div className="p-10 space-y-8">
      {modelAlert && (
        <div className="p-6 rounded-[2.5rem] animate-pulse flex justify-between items-center shadow-2xl border-4" style={{ background: '#2E1616', borderColor: 'rgba(214,69,69,0.25)' }}>
          <div className="flex items-center gap-6 px-4">
            <AlertCircle size={40} color="#D64545" />
            <div>
              <h3 className="font-black uppercase text-sm tracking-widest" style={{ color: '#E8B0A8' }}>Critic Agent: Model Güvenliği Tehdit Altında!</h3>
              <p className="text-xs font-bold mt-1" style={{ color: '#C99C96' }}>{modelAlert.driftReport || modelAlert.drift_report}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModelAlert(null)} className="px-4 py-2 rounded-xl font-black text-[9px] uppercase" style={{ background: '#D64545', color: '#1C0D0A' }}>Eski Modeli Koru</button>
            <button onClick={handleForceApprove} className="px-4 py-2 rounded-xl font-black text-[9px] uppercase border" style={{ background: '#4A2020', color: '#E8B0A8', borderColor: 'rgba(255,255,255,0.15)' }}>Yine de Onayla</button>
          </div>
        </div>
      )}

      <div className="p-8 rounded-[2.5rem] border" style={{ background: '#1F2328', borderColor: '#33383F' }}>
        <div className="flex justify-between gap-3">
          <div className="flex-1 p-6 rounded-3xl border-2 border-dashed text-center cursor-pointer" style={{ borderColor: '#FF6B35', background: '#241C14' }}>
            <UploadCloud className="mx-auto mb-2" size={28} style={{ color: '#FF6B35' }} />
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="block text-[9px] font-black uppercase cursor-pointer" style={{ color: '#F2EFEA' }}>
              {training ? 'Eğitiliyor...' : 'Veri Yükle'}
            </label>
          </div>
          <div className="flex-1 p-6 rounded-3xl border-2 border-dashed text-center cursor-pointer" style={{ borderColor: '#7A4A3E', background: '#241512' }}>
            <FileText className="mx-auto mb-2" size={28} style={{ color: '#D64545' }} />
            <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload" className="block text-[9px] font-black uppercase cursor-pointer" style={{ color: '#D64545' }}>Belge Yükle</label>
          </div>
        </div>
      </div>
      {blindSpots.length > 0 && (
        <div className="p-8 rounded-[2.5rem] border" style={{ background: '#1F2328', borderColor: '#FF6B35' }}>
          <h4 className="font-black uppercase text-[11px] mb-3 flex items-center gap-2" style={{ color: '#FF6B35' }}>
            ⚠ Kör Nokta Raporu
          </h4>
          <p className="text-[11.5px] mb-5" style={{ color: '#868C93' }}>
            Yüklediğiniz veri setinde, modelin şu anda <b style={{ color: '#D8D4CC' }}>kullanmadığı</b> ama hedef değişkenle güçlü ilişkisi olan kolonlar tespit edildi. Bu, mevcut tahminlerin bu faktörü göz ardı ediyor olabileceği anlamına gelir.
          </p>
          <div className="space-y-2">
            {blindSpots.map((b, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] py-3 border-b" style={{ borderColor: '#2A2E34' }}>
                <span className="font-bold" style={{ color: '#F2EFEA' }}>{b.column}</span>
                <span className="font-mono font-bold" style={{ color: b.correlation >= 0 ? '#5FA88F' : '#D64545' }}>
                  korelasyon: {b.correlation >= 0 ? '+' : ''}{b.correlation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}