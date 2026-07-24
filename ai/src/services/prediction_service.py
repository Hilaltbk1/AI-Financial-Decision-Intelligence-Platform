
import joblib
import pandas as pd
import os
import shap
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import numpy as np

class PredictionService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(current_dir))
        self.model_path = os.path.join(root_dir, "models", "profit_predictor_model.joblib")
        self.model = joblib.load(self.model_path)
        self.pending_model = None  # Anomali tespit edilince onay bekleyen model burada tutulur

        self.feature_names = [
            'USD_TRY', 'Steel_Price_USD', 'Production_Volume', 'Sales_Volume',
            'Unit_Labor_Cost_TRY', 'USD_TRY_Change', 'Steel_Change_USD',
            'USD_TRY_MA3', 'Last_Month_Profit', 'Last_Month_Margin',
            'Unit_Cost_Total_TRY', 'Month'
        ]
        self.feature_names_tr = {
            'USD_TRY': 'Döviz Kuru',
            'Steel_Price_USD': 'Çelik Fiyatı',
            'Production_Volume': 'Üretim Hacmi',
            'Sales_Volume': 'Satış Hacmi',
            'Unit_Labor_Cost_TRY': 'İşçilik Maliyeti',
            'USD_TRY_Change': 'Döviz Değişimi',
            'Steel_Change_USD': 'Çelik Değişimi',
            'USD_TRY_MA3': 'Döviz Ort. (3 Ay)',
            'Last_Month_Profit': 'Geçen Ay Kârı',
            'Last_Month_Margin': 'Geçen Ay Marjı',
            'Unit_Cost_Total_TRY': 'Birim Maliyet',
            'Month': 'Ay'
        }

    def predict(self, input_data: dict):
        df_input = pd.DataFrame([input_data])
        df_input = df_input[self.feature_names]
        prediction = self.model.predict(df_input)
        return float(prediction[0])

    def get_feature_weights(self):
        """Random Forest için özellik önem derecelerini döner."""
        # RF modelinde coef_ yerine feature_importances_ kullanılır
        importances = self.model.feature_importances_
        return dict(zip(self.feature_names, importances))

    def retrain_model(self, new_data_list):
        df = pd.DataFrame(new_data_list)
        X = df[self.feature_names]
        y = df['Net_Profit_TRY']

        # 1. ESKİ PERFORMANS (Mevcut modelin yeni verideki hatası)
        old_mae = mean_absolute_error(y, self.model.predict(X))

        # 2. YENİ MODEL EĞİTİMİ
        temp_model = RandomForestRegressor(n_estimators=100, random_state=42)
        temp_model.fit(X, y)
        new_mae = mean_absolute_error(y, temp_model.predict(X))

        # 3. GÜÇLENDİRİLMİŞ CRITIC LOGIC (Zeka Filtresi)
        # Kural A: Hata payı %15'ten fazla arttı mı?
        mae_risk = new_mae > (old_mae * 1.15)

        # Kural B: Veride "Saçma" (Outlier) rakamlar var mı?
        # (Örn: Bir otomobil şirketinin aylık kârı 10 Milyar TL'den fazla veya -5 Milyar TL'den az olamaz varsayımı)
        extreme_values = (y.max() > 1_000_000_000) or (y.min() < -500_000_000)

        is_anomaly = bool(mae_risk or extreme_values)

        drift_report = "Veri tutarlı."
        if is_anomaly:
            if extreme_values:
                drift_report = "KRİTİK: Veri setinde imkansız finansal rakamlar (Outlier) tespit edildi!"
            else:
                drift_report = "UYARI: Yeni veriler modelin tahmin kalitesini bozuyor (Hata artışı)."

        improvement = float(((old_mae - new_mae) / old_mae) * 100) if old_mae > 0 else 0

        # SADECE GÜVENLİYSE GÜNCELLE
        if not is_anomaly:
            self.model = temp_model
            self.pending_model = None
            joblib.dump(self.model, self.model_path)
        else:
            # Anomalili olsa bile modeli sakla, CFO "yine de onayla" derse kullanılacak
            self.pending_model = temp_model

        return {
            "status": "warning" if is_anomaly else "success",
            "new_mae": float(new_mae),
            "improvement_pct": round(improvement, 2),
            "is_anomaly": is_anomaly,
            "drift_report": drift_report
        }

    def _investigate_drift(self, df):
        """Hangi sütunun (feature) dağılımı bozulmuş? (Basit Root-Cause)"""
        # Örnek: Dolar kuru aşırı oynaksa hata artar
        if df['USD_TRY'].std() > 5:
            return "Döviz kurundaki aşırı volatilite modelin tahmin yeteneğini bozuyor."
        return "Veri seti içinde gürültülü (noisy) kayıtlar tespit edildi."

    def force_approve(self):
        """CFO/onaylayıcı, anomali uyarısına rağmen modeli yine de onayladığında çağrılır."""
        if self.pending_model is None:
            return {"success": False, "message": "Onay bekleyen bir model bulunamadı."}

        self.model = self.pending_model
        joblib.dump(self.model, self.model_path)
        self.pending_model = None
        return {"success": True, "message": "Anomalili model CFO onayıyla diske yazıldı ve yayına alındı."}

    def explain(self, input_data: dict):
        """SHAP kullanarak bu tahminin NEDEN bu sonucu verdiğini açıklar."""
        df_input = pd.DataFrame([input_data])
        df_input = df_input[self.feature_names]

        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(df_input)

        # --- expected_value'yu güvenle tek bir sayıya indir (sürüme göre dizi/liste/skaler olabiliyor) ---
        expected_value = explainer.expected_value
        if isinstance(expected_value, (list, np.ndarray)):
            expected_value = np.array(expected_value).flatten()[0]
        base_value = float(expected_value)

        # --- shap_values'i de güvenle 1 boyutlu bir diziye indir ---
        sv = np.array(shap_values)
        if sv.ndim == 3:  # bazı sürümlerde (1, n_samples, n_features) şeklinde gelir
            sv = sv[0]
        if sv.ndim == 2:  # (n_samples, n_features) -> ilk (ve tek) satırı al
            sv = sv[0]

        prediction = float(self.model.predict(df_input)[0])

        contributions = []
        for i, feature in enumerate(self.feature_names):
            contributions.append({
                "feature": self.feature_names_tr.get(feature, feature),
                "value": round(float(sv[i]), 2)
            })

        # En büyük etkiden en küçüğe sırala (mutlak değere göre)
        contributions.sort(key=lambda c: abs(c["value"]), reverse=True)

        return {
            "baseValue": round(base_value, 2),
            "prediction": round(prediction, 2),
            "contributions": contributions
        }