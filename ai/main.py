from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uvicorn
# Gemini kullanan servisi içeri aktarıyoruz
from src.services.recommendation_service import RecommendationService
import pandas as pd
import traceback
import yfinance as yf
from fastapi.middleware.cors import CORSMiddleware
from src.services.prediction_service import PredictionService
from src.services.simulation_service import SimulationService
from fastapi import Form

KNOWN_COLUMNS = {
    'usdRate', 'steelPrice', 'productionVolume', 'salesVolume', 'laborCost',
    'usdChange', 'steelChange', 'usdMa3', 'lastProfit', 'lastMargin',
    'unitCost', 'month', 'netProfit'
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = PredictionService()
sim_service = SimulationService(predictor)
analyst_service = RecommendationService()


# --- VERİ ŞEMALARI (C# İLE TAM SENKRON) ---
class FinancialDataSchema(BaseModel):
    USD_TRY: float = Field(..., alias="usdRate")
    Steel_Price_USD: float = Field(..., alias="steelPrice")
    Production_Volume: int = Field(..., alias="productionVolume")
    Sales_Volume: int = Field(..., alias="salesVolume")
    Unit_Labor_Cost_TRY: float = Field(..., alias="laborCost")
    USD_TRY_Change: float = Field(..., alias="usdChange")
    Steel_Change_USD: float = Field(..., alias="steelChange")
    USD_TRY_MA3: float = Field(..., alias="usdMa3")
    Last_Month_Profit: float = Field(..., alias="lastProfit")
    Last_Month_Margin: float = Field(..., alias="lastMargin")
    Unit_Cost_Total_TRY: float = Field(..., alias="unitCost")
    Month: int = Field(..., alias="month")
    Net_Profit_TRY: float = Field(..., alias="netProfit")
    model_config = ConfigDict(populate_by_name=True)


class SimulationInput(BaseModel):
    base_data: FinancialDataSchema = Field(..., alias="baseData")
    usd_change: float = Field(0.0, alias="usdChange")
    steel_change: float = Field(0.0, alias="steelChange")
    production_change: float = Field(0.0, alias="productionChange")
    model_config = ConfigDict(populate_by_name=True)


class OptimizeInput(BaseModel):
    base_data: FinancialDataSchema = Field(..., alias="baseData")
    target_profit: float = Field(..., alias="targetProfit")
    user_id: int = Field(0, alias="userId")
    model_config = ConfigDict(populate_by_name=True)


class ChatRequest(BaseModel):
    user_query: str
    sim_context: dict
    user_id: int = 0


class ExecutiveReportRequest(BaseModel):
    sim_context: dict
    target_profit: float
    user_id: int = 0


# --- ENDPOINT'LER ---
@app.post("/executive-report")
def executive_report(request: ExecutiveReportRequest):
    try:
        report = analyst_service.generate_executive_report(
            request.sim_context,
            request.target_profit,
            request.user_id
        )
        return {"report": report}
    except Exception as e:
        print(f"❌ Python Executive Report Hatası: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate")
def simulate(scenario: SimulationInput):
    try:
        return sim_service.run_scenario(scenario.base_data.model_dump(), {
            "usd_change": scenario.usd_change,
            "steel_change": scenario.steel_change,
            "production_change": scenario.production_change
        })
    except Exception as e:
        print(f"❌ Python Simulate Hatası: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain")
def explain(scenario: SimulationInput):
    try:
        sim_data = sim_service.run_scenario(scenario.base_data.model_dump(), {
            "usd_change": scenario.usd_change,
            "steel_change": scenario.steel_change,
            "production_change": scenario.production_change
        })
        # run_scenario'nun kullandığı GÜNCEL veriyi tekrar oluşturuyoruz (explain aynı sim_data'yı ister)
        base_data = scenario.base_data.model_dump()
        usd_mult = 1 + scenario.usd_change
        steel_mult = 1 + scenario.steel_change
        prod_mult = 1 + scenario.production_change

        explain_input = base_data.copy()
        explain_input['USD_TRY'] = base_data['USD_TRY'] * usd_mult
        explain_input['Steel_Price_USD'] = base_data['Steel_Price_USD'] * steel_mult
        explain_input['Production_Volume'] = int(base_data['Production_Volume'] * prod_mult)
        explain_input['Sales_Volume'] = int(base_data['Sales_Volume'] * prod_mult)
        explain_input['Unit_Labor_Cost_TRY'] = base_data.get('Unit_Labor_Cost_TRY', 28000) * (usd_mult ** 0.7)
        usd_rate = explain_input['USD_TRY']
        mat_cost_unit = (explain_input['Steel_Price_USD'] * 1.2 + 15000) * usd_rate
        energy_cost_unit = (2500 * 2.8 / 1000) * (usd_rate / 10)
        explain_input['Unit_Cost_Total_TRY'] = mat_cost_unit + energy_cost_unit + explain_input['Unit_Labor_Cost_TRY']

        result = predictor.explain(explain_input)
        return result
    except Exception as e:
        print(f"❌ Python Explain Hatası: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize")
def optimize(data: OptimizeInput):
    try:
        plan = sim_service.find_target_scenario(data.base_data.model_dump(), data.target_profit)

        if not plan:
            raise ValueError("Uygun bir senaryo bulunamadı.")

        reasoning_query = f"Hedef kârı {data.target_profit:,.0f} TL yapmak için bir plan bulduk. Bu planı CFO gibi yorumla."

        try:
            ai_summary = analyst_service.ask_question(reasoning_query, plan, data.user_id)
            plan["ai_summary"] = ai_summary
        except:
            plan["ai_summary"] = "Strateji optimize edildi, ancak AI raporu şu an üretilemiyor."
        return plan

    except Exception as e:
        print("!!! OPTİMİZASYON HATASI !!!")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        answer = analyst_service.ask_question(request.user_query, request.sim_context, request.user_id)
        return {"answer": answer}
    except Exception as e:
        print(f"❌ Python Chat Hatası: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market/live")
def get_market():
    try:
        usd = yf.download("USDTRY=X", period="1d", progress=False)["Close"].values[-1]
        return {
            "usdTry": round(float(usd), 4),
            "steelUsd": 820.40,
            "eurTry": 37.40
        }
    except:
        return {
            "usdTry": 34.55,
            "steelUsd": 820.0,
            "eurTry": 37.40
        }


@app.post("/upload-strategy")
async def upload_strategy(file: UploadFile = File(...), user_id: int = Form(0)):
    try:
        content = await file.read()
        from src.services.pdf_service import PDFService
        text = PDFService.extract_text(content)

        if not text:
            raise ValueError("PDF içeriği okunamadı.")

        analyst_service.update_knowledge(text, user_id, file.filename)
        return text
    except Exception as e:
        print(f"Hata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
async def train(data: List[dict]):
    try:
        df_list = []
        for item in data:
            df_list.append({
                'USD_TRY': item.get('usdRate'),
                'Steel_Price_USD': item.get('steelPrice'),
                'Production_Volume': item.get('productionVolume'),
                'Sales_Volume': item.get('salesVolume'),
                'Unit_Labor_Cost_TRY': item.get('laborCost'),
                'USD_TRY_Change': item.get('usdChange', 0),
                'Steel_Change_USD': item.get('steelChange', 0),
                'USD_TRY_MA3': item.get('usdMa3', item.get('usdRate')),
                'Last_Month_Profit': item.get('lastProfit', 0),
                'Last_Month_Margin': item.get('lastMargin', 0),
                'Unit_Cost_Total_TRY': item.get('unitCost', 0),
                'Month': item.get('month', 1),
                'Net_Profit_TRY': item.get('netProfit')  # Hedef değişken
            })

        # --- KÖR NOKTA TESPİTİ (Blind Spot Detection) ---
        # NOT: for döngüsünün DIŞINDA, yani tüm satırlar için TEK SEFER çalışıyor
        blind_spots = []
        if data:
            all_keys = set()
            for item in data:
                all_keys.update(item.keys())
            extra_columns = all_keys - KNOWN_COLUMNS

            raw_df = pd.DataFrame(data)
            target = pd.to_numeric(raw_df.get('netProfit'), errors='coerce') if 'netProfit' in raw_df.columns else None

            for col in extra_columns:
                series = pd.to_numeric(raw_df[col], errors='coerce')
                if target is not None and series.notna().sum() >= 3:
                    corr = series.corr(target)
                    if corr is not None and not pd.isna(corr) and abs(corr) >= 0.5:
                        blind_spots.append({
                            "column": col,
                            "correlation": round(float(corr), 2)
                        })
            blind_spots.sort(key=lambda b: abs(b["correlation"]), reverse=True)

        # --- MLOps GÜVENLİK BARİYERİ (ÇİFT YÖNLÜ ANOMALİ TESPİTİ) ---
        is_anomaly = False
        drift_report = ""

        for row in df_list:
            usd_val = row.get('USD_TRY')
            net_profit = row.get('Net_Profit_TRY')

            if usd_val is not None and (usd_val <= 1.0 or usd_val >= 50000000000.0):
                is_anomaly = True
                drift_report = f"Kritik Güvenlik Uyarısı: Veri setinde geçersiz kur değeri ({usd_val:,.2f} TL) saptandı."
                break

            if net_profit is not None and (net_profit <= 1.0 or net_profit >= 50000000000.0):
                is_anomaly = True
                drift_report = f"Kritik Güvenlik Uyarısı: Veri setinde olağan dışı Net Kâr değeri ({net_profit:,.2f} TL) saptandı. Model eğitimi güvenlik nedeniyle iptal edildi."
                break

        if is_anomaly:
            print("🚨 ANOMALİ YAKALANDI: Trilyonluk sahte kar verisi saptandı, model koruma altında!")
            return {
                "is_anomaly": True,
                "isAnomaly": True,
                "drift_report": drift_report,
                "driftReport": drift_report,
                "message": "Model güvenlik duvarı tetiklendi. Veride anomali saptandı.",
                "blindSpots": blind_spots
            }

        # Veri temizse normal eğitime devam et
        metrics = predictor.retrain_model(df_list)
        metrics["blindSpots"] = blind_spots
        print(f"🎯 Model Eğitildi: Yeni MAE: {metrics['new_mae']}")
        return metrics

    except Exception as e:
        import traceback
        print(f"❌ EĞİTİM HATASI: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        import traceback
        print(f"❌ EĞİTİM HATASI: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/approve-model")
def approve_model():
    try:
        result = predictor.force_approve()
        return result
    except Exception as e:
        print(f"❌ Model Onay Hatası: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)