import os
import json
import re

import requests
from dotenv import load_dotenv
from groq import Groq
from ai.src.services.memory_service import MemoryService

load_dotenv()


class RecommendationService:

    def __init__(self):
        # Hafıza
        self.memory = MemoryService()

        # API Key
        self.api_key = os.getenv("GROQ_API_KEY")

        self.use_llm = False

        if self.api_key and self.api_key.startswith("gsk_"):
            try:
                self.client = Groq(api_key=self.api_key)
                # Ufak bir bağlantı testi
                self.client.chat.completions.create(model="llama-3.1-8b-instant",
                                                    messages=[{"role": "user", "content": "hi"}], max_tokens=1)
                self.use_llm = True
                print("✅ ZAFER: Groq Llama 3.1 Beyni Hazır.")
            except Exception as e:
                print(f"❌ Groq Bağlantı Hatası: {e}")

        # 3. AÇILIŞTA SQL SERVER'DAKİ BELGELERİ HATIRLA
        self.sync_with_sql()

    def sync_with_sql(self):
        """Python her açıldığında C# üzerinden SQL'deki PDF metinlerini çeker."""
        try:
            print("🔄 Kurumsal hafıza SQL Server ile senkronize ediliyor...")
            # C# Gateway adresi (Port 7283) - 3. maddedeki yeni "internal" endpoint'i kullanıyoruz
            response = requests.get("https://localhost:7283/api/financial/documents/all-internal", verify=False,headers={"X-Internal-Key": "7b29cb41-3b8e-4a74-9efd-71b3dc92a011"},
                                    timeout=3)
            if response.status_code == 200:
                docs = response.json()
                for d in docs:
                    self.memory.add_to_memory(d['userId'], d['content'], d['fileName'])
                print(f"✅ Senkronizasyon Tamam: {len(docs)} belge hatırlandı.")
        except Exception as e:
            print(f"⚠️ SQL Senkronizasyonu şu an yapılamadı: {e}")

    def update_knowledge(self, text, user_id=0, filename="strategy"):
        """Yeni bir belge yüklendiğinde hafızaya kaydeder."""
        return self.memory.add_to_memory(user_id, text, filename)

    def parse_simulation_command(self, user_query):
        """Doğal dilden sürgü emri ayıklar."""
        if not self.use_llm: return None
        prompt = f"Kullanıcı emri: '{user_query}'\nSADECE JSON DÖN: {{\"usd_change\": 0.0, \"steel_change\": 0.0, \"production_change\": 0.0}}"
        try:
            res = self.client.chat.completions.create(model="llama-3.1-8b-instant",
                                                      messages=[{"role": "user", "content": prompt}])
            match = re.search(r"\{.*\}", res.choices[0].message.content, re.DOTALL)
            return json.loads(match.group(0)) if match else None
        except Exception as e:
            print(f"⚠️ Komut ayrıştırma hatası: {e}")
            return None

    def ask_question(self, user_query, sim_context, user_id=0):
        """Çoklu Ajan Raporu üretir."""
        # Veri Normalizasyonu
        ctx = {k.lower(): v for k, v in sim_context.items()}
        impact = ctx.get('impactpct') or 0
        profit = ctx.get('simulatedprofit') or 0
        usd = ctx.get('simulatedusdrate') or 0
        cost = ctx.get('simulatedunitcost') or 0

        # HAFIZADAN BİLGİ ÇEK (RAG) - artık SADECE bu kullanıcının hafızasından
        knowledge = self.memory.query_memory(user_id, user_query)

        if self.use_llm:
            try:
                # MULTI-AGENT DEBATE PROMPT
                prompt = f"""
                                Sen DecisionOS Strateji Kurulu Moderatörüsün.
                                Veriler: Kar Değişimi %{impact}, Tahmini Kar: {profit:,.0f} TL, Kur: {usd} TL, Maliyet: {cost:,.0f} TL.
                                Kurumsal Hafıza (PDF): {knowledge}

                                Kullanıcının sorusu: {user_query}

                                Kurallar:
                                - Soru basit/kısa bir bilgi talebiyse (örn. bir rakam, bir isim, evet/hayır), SADECE 1-2 cümlelik net bir cevap ver. Ajan raporu YAZMA.
                                - Soru gerçekten stratejik bir karar/analiz gerektiriyorsa (örn. "kur artarsa ne yapmalıyız", "riskleri değerlendir"), o zaman CFO, Risk ve Strateji ajanları adına kısa (her biri 2-3 cümle) bir tartışma yaz.
                                - Gereksiz uzatma, doğrudan cevap ver.
                                """
                completion = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=400
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"Groq Yanıt Hatası: {e}")
                return self._expert_fallback(impact, profit, usd)

        return self._expert_fallback(impact, profit, usd)

    def generate_executive_report(self, sim_context, target_profit, user_id=0):
        """CFO Seviyesinde AI Executive Advisor Raporu Üretir (HTML Biçimli)."""
        ctx = {k.lower(): v for k, v in sim_context.items()}
        original_profit = ctx.get('originalprofit') or 0
        simulated_profit = ctx.get('simulatedprofit') or 0
        impact_pct = ctx.get('impactpct') or 0
        simulated_usd = ctx.get('simulatedusdrate') or 34.5
        simulated_steel = ctx.get('simulatedsteelprice') or 820.0
        unit_cost = ctx.get('simulatedunitcost') or 0

        # RAG Entegrasyonu - Şirket strateji belgelerinden bütçe, maliyet ve risk direktiflerini tara
        knowledge = self.memory.query_memory(user_id, "bütçe hedef kısıtlama maliyet risk strateji")

        if self.use_llm:
            try:
                prompt = f"""
                Sen DecisionOS Baş Yönetici Danışmanı ve Kıdemli CFO Danışmanısın.
                Aşağıdaki simülasyon çıktılarını ve şirket bütçe belgelerinden gelen bilgileri analiz ederek CFO ve Yönetim Kurulu'na sunulacak bir 'AI Executive Advisor Stratejik Analiz Raporu' hazırla.

                FİNANSAL VERİLER:
                - Mevcut Baz Senaryo Kârı: {original_profit:,.0f} TL
                - Simüle Edilen Net Kâr: {simulated_profit:,.0f} TL
                - Kâr Varyansı: %{impact_pct:,.2f}
                - Simülasyon Döviz Kuru: {simulated_usd:,.2f} TL
                - Simülasyon Çelik Ton Fiyatı: {simulated_steel:,.2f} USD
                - Birim Maliyet: {unit_cost:,.2f} TL
                - Hedef Kâr (Hedeflenen): {target_profit:,.0f} TL

                KURUMSAL BELGE REFERANSLARI (RAG):
                {knowledge if knowledge else "Yüklenmiş kurumsal strateji belgesi bulunamadı. Genel sektör pratikleri baz alınacaktır."}

                TALİMATLAR:
                1. Rapor son derece profesyonel, akıcı ve C-Level düzeyinde bir hitap diline sahip olmalıdır.
                2. Raporu SADECE geçerli, şık inline CSS stillerine sahip HTML etiketleriyle yaz. Markdown (```html gibi) işaretçileri kesinlikle KULLANMA.
                3. Temaya uygun kurumsal renk paleti kullan: Koyu Yeşil (#1F3D2E) ve Altın Sarısı/Taba (#A9823F) tonları tercih edilmelidir.
                4. Rapor şu bölümlerden oluşmalıdır:
                   - Yönetici Özeti (Executive Summary)
                   - Hassasiyet ve Risk Analizi (Sensitivity Analysis)
                   - Stratejik Öneriler ve Yol Haritası (Strategic Action Items)
                   - Kurumsal Hafıza Uyumluluğu (Eğer varsa yüklenen PDF dosyalarındaki direktiflerle kâr senaryosunun çelişip çelişmediğini net olarak belirt)

                KULLANABİLECEĞİNİZ ETİKET ÖRNEKLERİ:
                - Bölüm Başlıkları: <h2 style="color: #1F3D2E; border-bottom: 2px solid #E7E1D3; padding-bottom: 6px; margin-top: 20px; font-size: 14px; font-weight: 800; text-transform: uppercase;">...</h2>
                - Alt Başlıklar: <h3 style="color: #A9823F; font-size: 12px; font-weight: 700; margin-top: 12px; margin-bottom: 6px;">...</h3>
                - Paragraflar: <p style="color: #2F3E36; font-size: 11.5px; line-height: 1.6; margin-bottom: 10px;">...</p>
                - Listeler: <ul style="list-style-type: square; margin-left: 18px; margin-bottom: 10px;"><li style="color: #2F3E36; font-size: 11.5px; margin-bottom: 4px;">...</li></ul>
                - Vurgulamalar: <strong style="color: #12261C;">...</strong>
                """
                completion = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1500
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"Rapor LLM Üretim Hatası: {e}")

        # LLM çalışmazsa profesyonel statik yedek rapor şablonu
        return f"""
        <h2 style="color: #1F3D2E; border-bottom: 2px solid #E7E1D3; padding-bottom: 6px; margin-top: 20px; font-size: 14px; font-weight: 800; text-transform: uppercase;">Yönetici Özeti</h2>
        <p style="color: #2F3E36; font-size: 11.5px; line-height: 1.6; margin-bottom: 10px;">
            Simülasyon sonuçları incelendiğinde, şirketin net kârının baz senaryoya kıyasla <strong>%{impact_pct:,.2f}</strong> oranında bir değişimle <strong>{simulated_profit:,.0f} TL</strong> seviyesinde gerçekleşeceği tahmin edilmektedir. Belirlenen <strong>{target_profit:,.0f} TL</strong> kâr hedefinin yakalanabilmesi için acil finansal önlemler gerekmektedir.
        </p>
        <h2 style="color: #1F3D2E; border-bottom: 2px solid #E7E1D3; padding-bottom: 6px; margin-top: 20px; font-size: 14px; font-weight: 800; text-transform: uppercase;">Stratejik Öneriler</h2>
        <ul style="list-style-type: square; margin-left: 18px; margin-bottom: 10px;">
            <li style="color: #2F3E36; font-size: 11.5px; margin-bottom: 4px;">Kur artışından kaynaklanan birim maliyet riski ({unit_cost:,.2f} TL) hedge edilmelidir.</li>
            <li style="color: #2F3E36; font-size: 11.5px; margin-bottom: 4px;">Hammadde (Çelik) tedarik zinciri kontratları sabitlenmelidir (Simüle fiyat: {simulated_steel} USD).</li>
        </ul>
        """

    def _expert_fallback(self, impact, profit, usd):
        return f"🤖 [YEDEK MOD]: Kar %{impact} değişimle {profit:,.0f} TL öngörülüyor. Kur: {usd} TL."

    @staticmethod
    def generate_recommendations(impact_pct, simulated_data):
        if impact_pct > 10: return ["Kâr artışı: Yatırım fırsatı."]
        return ["Maliyet disiplini korunmalı."]