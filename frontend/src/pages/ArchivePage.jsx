import { History } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ArchivePage() {
  const { history } = useApp();

  return (
    <div className="p-10">
      <div className="p-10 rounded-[3rem] border" style={{ background: '#1F2328', borderColor: '#33383F' }}>
        <h4 className="font-black uppercase tracking-tight flex items-center gap-2 mb-10 border-b pb-6" style={{ color: '#F2EFEA', borderColor: '#33383F' }}>
          <History size={20} style={{ color: '#FF6B35' }} /> Senaryo Arşivi
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-bold text-[11px]" style={{ color: '#868C93' }}>
            <thead className="uppercase tracking-widest text-[9px] font-black">
              <tr className="border-b" style={{ borderColor: '#33383F' }}>
                <th className="pb-4">Zaman Damgası</th>
                <th className="pb-4 text-center">Kur Şoku</th>
                <th className="pb-4 text-right">Tahmini Kâr</th>
                <th className="pb-4 text-right">Varyans</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((h, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#2A2E34' }}>
                  <td className="py-4">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 rounded-full font-black" style={{ background: '#101214', color: '#D8D4CC' }}>%{Math.round((h.usdChangeInput || 0) * 100)}</span>
                  </td>
                  <td className="py-4 text-right font-black" style={{ color: '#F2EFEA' }}>{(h.simulatedProfit || 0).toLocaleString()} TL</td>
                  <td className="py-4 text-right font-black" style={{ color: h.impactPct > 0 ? '#5FA88F' : '#D64545' }}>%{(h.impactPct || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}