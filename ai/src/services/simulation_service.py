from ai.src.services.prediction_service import PredictionService
from ai.src.business_rules.finance_rules import FinanceRules


class SimulationService:
    def __init__(self, predictor: PredictionService = None):
        self.predictor = predictor or PredictionService()
        self.rules = FinanceRules()

    def run_scenario(self, base_data: dict, adjustments: dict):
        sim_data = base_data.copy()

        # 1. Çarpanlar
        usd_mult = 1 + adjustments.get('usd_change', 0)
        steel_mult = 1 + adjustments.get('steel_change', 0)
        prod_mult = 1 + adjustments.get('production_change', 0)

        # 2. Değişkenleri Güncelle
        sim_data['USD_TRY'] = base_data['USD_TRY'] * usd_mult
        sim_data['Steel_Price_USD'] = base_data['Steel_Price_USD'] * steel_mult
        sim_data['Production_Volume'] = int(base_data['Production_Volume'] * prod_mult)
        sim_data['Sales_Volume'] = int(base_data['Sales_Volume'] * prod_mult)

        # Maliyet hesaplamaları
        usd_rate = sim_data['USD_TRY']
        sim_data['Unit_Labor_Cost_TRY'] = base_data.get('Unit_Labor_Cost_TRY', 28000) * (usd_mult ** 0.7)
        mat_cost_unit = self.rules.calculate_raw_material_cost(
            sim_data['Steel_Price_USD'], usd_rate, volume=1
        )
        energy_cost_unit = self.rules.calculate_energy_cost(
            energy_index=2.8, usd_try=usd_rate, volume=1
        )
        sim_data['Unit_Cost_Total_TRY'] = mat_cost_unit + energy_cost_unit + sim_data['Unit_Labor_Cost_TRY']

        # Model tahmini
        sim_profit = self.predictor.predict(sim_data)
        original_profit = float(base_data.get('Net_Profit_TRY', 1))

        # Her bir değişikliğin kâra olan ham etkisini hesaplayalım
        usd_effect = abs(usd_mult - 1) * 100
        steel_effect = abs(steel_mult - 1) * 100
        prod_effect = abs(prod_mult - 1) * 100

        # Toplam etki içinde normalize edelim (Pasta dilimleri için)
        total = usd_effect + steel_effect + prod_effect + 5  # 5 operasyonel sabit

        return {
            "originalProfit": original_profit,
            "simulatedProfit": float(sim_profit),
            "impactPct": round(((sim_profit / original_profit) - 1) * 100, 2),
            "simulatedUsdRate": round(float(usd_rate), 2),
            "simulatedUnitCost": round(float(sim_data['Unit_Cost_Total_TRY']), 2),

            # --- DİJİTAL İKİZ İÇİN YENİ EKLENEN CANLI MALİYET BİLEŞENLERİ ---
            "simulatedLaborCost": round(float(sim_data['Unit_Labor_Cost_TRY']), 2),
            "simulatedMaterialCost": round(float(mat_cost_unit), 2),
            "simulatedEnergyCost": round(float(energy_cost_unit), 2),
            "simulatedSteelPrice": round(float(sim_data['Steel_Price_USD']), 2),
            "productionVolume": sim_data['Production_Volume'],

            "driverData": [
                {"name": "Döviz Etkisi", "value": round((usd_effect / total) * 100, 2)},
                {"name": "Hammadde", "value": round((steel_effect / total) * 100, 2)},
                {"name": "Üretim Gücü", "value": round((prod_effect / total) * 100, 2)},
                {"name": "Operasyonel", "value": round((5 / total) * 100, 2)}
            ]
        }

    def find_target_scenario(self, base_data: dict, target_profit: float):
        """
        Hedef kâra ulaşmak için gereken en iyi slider ayarlarını bulur.
        """
        best_diff = float('inf')
        best_scenario = None

        for usd in [i / 100 for i in range(-10, 50, 5)]:  # -%10 ile %50 arası
            for steel in [i / 100 for i in range(-20, 40, 10)]:
                for prod in [i / 100 for i in range(-20, 30, 10)]:

                    adjustments = {
                        "usd_change": usd,
                        "steel_change": steel,
                        "production_change": prod
                    }

                    res = self.run_scenario(base_data, adjustments)
                    diff = abs(res['simulatedProfit'] - target_profit)

                    if diff < best_diff:
                        best_diff = diff
                        best_scenario = {
                            "usdChange": usd * 100,
                            "steelChange": steel * 100,
                            "productionChange": prod * 100,
                            "simulatedProfit": res['simulatedProfit'],
                            "impactPct": res['impactPct']
                        }

        return best_scenario