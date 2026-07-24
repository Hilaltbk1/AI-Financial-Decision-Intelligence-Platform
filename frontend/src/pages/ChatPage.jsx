import { Bot, BrainCircuit, Briefcase, Send, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ChatPage() {
  const { chatMessage, setChatMessage, chatHistory, handleChat } = useApp();

  return (
    <div className="p-10">
      <div className="flex flex-col h-[calc(100vh-220px)] relative overflow-hidden rounded-[2.5rem] p-10 shadow-2xl"
           style={{ background: 'linear-gradient(175deg,#23272D,#14161A)', border: '1px solid #33383F', color: '#F2EFEA' }}>
        <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12 scale-150"><Briefcase size={200} /></div>
        <div className="flex items-center justify-between mb-6 border-b pb-5 font-bold uppercase tracking-widest text-[9px]" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#FF6B35' }}>
          <div className="flex items-center gap-3"><BrainCircuit size={24} /><h4>AI Analiz Kurulu</h4></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-5 mb-5 pr-4 text-[12px] leading-relaxed relative z-10 font-medium">
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2.5 rounded-xl h-fit ${m.role === 'user' ? 'bg-white/15' : 'bg-white/5'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`whitespace-pre-wrap max-w-[75%] p-5 rounded-[1.5rem] shadow-2xl border border-white/5 ${m.role === 'user' ? 'rounded-tr-none' : 'bg-white/5 rounded-tl-none'}`}
                   style={m.role === 'user' ? { background: 'linear-gradient(150deg,#FF6B35,#C1440E)', color: '#1A1300' } : { color: 'rgba(242,239,234,0.9)' }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            placeholder="AI Analiste strateji danışın..."
            className="flex-1 bg-transparent border-none px-4 py-2 outline-none text-xs font-bold"
            style={{ color: '#F2EFEA' }}
          />
          <button onClick={handleChat} className="p-3 rounded-xl shadow-lg" style={{ background: 'linear-gradient(150deg,#FF6B35,#C1440E)' }}>
            <Send size={18} color="#1A1300" />
          </button>
        </div>
      </div>
    </div>
  );
}