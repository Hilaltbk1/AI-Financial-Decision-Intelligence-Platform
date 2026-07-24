import os
from dotenv import load_dotenv
import google.generativeai as genai


load_dotenv()


class LLMAnalystService:
    def __init__(self):

        self.knowledge_base = ""
        # API KEY artık kodda yok
        self.api_key = os.getenv("GOOGLE_API_KEY")

        self.use_llm = False
        self.model = None


        if self.api_key:

            try:
                genai.configure(
                    api_key=self.api_key
                )

                self.model = genai.GenerativeModel(
                    "gemini-1.5-flash"
                )

                self.use_llm = True

                print("✅ Gemini AI aktif")


            except Exception as e:

                print(
                    "❌ Gemini bağlantı hatası:",
                    e
                )

                self.use_llm = False


        else:

            print(
                "⚠️ GOOGLE_API_KEY bulunamadı. Expert Mode aktif."
            )



    def update_knowledge(self, text):

        self.knowledge_base = text

        print(
            "📚 AI Hafızası güncellendi!"
        )



    def ask_question(
            self,
            user_query,
            sim_context,
            **kwargs
    ):


        impact = (
            sim_context.get("impactPct")
            or sim_context.get("impact_pct")
            or 0
        )


        profit = (
            sim_context.get("simulatedProfit")
            or sim_context.get("simulated_profit")
            or 0
        )


        cost = (
            sim_context.get("simulatedUnitCost")
            or sim_context.get("simulated_unit_cost")
            or 0
        )


        usd = (
            sim_context.get("simulatedUsdRate")
            or sim_context.get("simulated_usd_rate")
            or 0
        )



        if self.use_llm:


            try:

                prompt = f"""

Sen bir Otomotiv CFO Analistisin.

Finansal simülasyon sonuçları:

Dolar:
{usd} TL

Kar değişimi:
%{impact}

Tahmini kar:
{profit} TL

Birim maliyet:
{cost} TL


Yönetici sorusu:

{user_query}


Finans direktörüne rapor verir gibi,
kısa ve stratejik cevap ver.
"""


                response = (
                    self.model
                    .generate_content(prompt)
                )


                return response.text



            except Exception as e:


                print(
                    "Gemini hata:",
                    e
                )

                return self._expert_fallback(
                    user_query,
                    impact,
                    profit,
                    cost,
                    usd
                )


        else:


            return self._expert_fallback(
                user_query,
                impact,
                profit,
                cost,
                usd
            )





    def _expert_fallback(
            self,
            query,
            impact,
            profit,
            cost,
            usd
    ):


        q = query.lower()


        if "dolar" in q or "kur" in q:


            return (
                f"ANALİZ: "
                f"Dolar {usd} TL seviyesinde. "
                f"Karlılık %{impact} değişti. "
                f"Beklenen kar {profit:,.2f} TL. "
                f"Birim maliyet {cost:,.2f} TL."
            )



        if "öneri" in q or "ne yapmalı" in q:


            if impact < 0:

                return (
                    f"STRATEJİ: "
                    f"Maliyet baskısı arttı. "
                    f"Birim maliyet {cost:,.2f} TL oldu. "
                    f"Tedarik ve maliyet optimizasyonu yapılmalı."
                )


            else:

                return (
                    f"STRATEJİ: "
                    f"Karlılık %{impact} arttı. "
                    f"{profit:,.2f} TL avantaj "
                    f"yatırım veya stok stratejisinde kullanılabilir."
                )



        return (
            f"Simülasyon sonucu: "
            f"%{impact} değişim ile "
            f"beklenen kar {profit:,.2f} TL."
        )