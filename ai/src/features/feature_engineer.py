import pandas as pd
import os
import sys


class FeatureEngineer:
    def __init__(self):
        # 1. DİNAMİK YOL HESAPLAMA (Mühendislik Çözümü)
        # Bu dosya: Root/src/features/feature_engineer.py
        # 1. dirname -> src/features
        # 2. dirname -> src
        # 3. dirname -> Root (Proje Ana Klasörü)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.root_dir = os.path.dirname(os.path.dirname(current_dir))

        self.input_path = os.path.join(self.root_dir, "data", "raw", "financial_data.csv")
        self.output_dir = os.path.join(self.root_dir, "data", "processed")
        self.output_path = os.path.join(self.output_dir, "financial_data_engineered.csv")

        print(f"🔍 Dosya aranıyor: {self.input_path}")

        if not os.path.exists(self.input_path):
            raise FileNotFoundError(
                f"❌ HATA: Ham veri bulunamadı! Lütfen önce 'src/generators/financial_data_generator.py' çalıştırdığından ve dosyanın oluştuğundan emin ol.")

        self.df = pd.read_csv(self.input_path)
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df = self.df.sort_values('Date')

    def create_features(self):
        df = self.df.copy()

        # Momentum: Kur ve Çelik değişim oranları
        df['USD_TRY_Change'] = df['USD_TRY'].pct_change()
        df['Steel_Change_USD'] = df['Steel_Price_USD'].pct_change()

        # Trend: 3 Aylık Hareketli Ortalama
        df['USD_TRY_MA3'] = df['USD_TRY'].rolling(window=3).mean()

        # Lag: Geçen ayın kârı ve marjı
        df['Last_Month_Profit'] = df['Net_Profit_TRY'].shift(1)
        df['Last_Month_Margin'] = df['Profit_Margin'].shift(1)

        # Verimlilik: Birim başı toplam maliyet
        df['Unit_Cost_Total_TRY'] = df['Total_Cost_TRY'] / df['Production_Volume']

        # Mevsimsellik: Ay bilgisi
        df['Month'] = df['Date'].dt.month

        # İlk satırlardaki NaN değerleri temizle
        df = df.dropna()
        return df

    def save_processed_data(self, df):
        os.makedirs(self.output_dir, exist_ok=True)
        df.to_csv(self.output_path, index=False)
        print(f"🚀 Feature Engineering BAŞARILI!")
        print(f"📍 İşlenmiş veri kaydedildi: {self.output_path}")


if __name__ == "__main__":
    try:
        fe = FeatureEngineer()
        processed_df = fe.create_features()
        fe.save_processed_data(processed_df)
    except Exception as e:
        print(e)