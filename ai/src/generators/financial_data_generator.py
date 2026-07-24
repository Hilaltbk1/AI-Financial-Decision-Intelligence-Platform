import pandas as pd
import numpy as np
import yfinance as yf
import os
from datetime import datetime, timedelta
import sys

# Yol Çözümü: Proje kök dizinini (Root) bul
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(root_dir)

from ai.src.business_rules.finance_rules import FinanceRules


class FinancialDataGenerator:
    def __init__(self, months=36):
        self.rules = FinanceRules()
        self.months = months
        self.end_date = datetime.now()
        self.start_date = self.end_date - timedelta(days=(months + 4) * 30)

        # MUTLAK YOL: Root/data/raw
        self.output_dir = os.path.join(root_dir, "data", "raw")
        os.makedirs(self.output_dir, exist_ok=True)

    def fetch_market_data(self):
        print(f"📡 Piyasa verileri çekiliyor (USD/TRY)...")
        data = yf.download("USDTRY=X", start=self.start_date, end=self.end_date, interval="1d")
        if data.empty: return pd.DataFrame()

        # Sütun isimlerini düzelt (yfinance bazen MultiIndex döner)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        close_series = data['Close'].dropna()
        df_market = close_series.resample('ME').last().to_frame()
        df_market.columns = ['USD_TRY']
        return df_market.dropna()

    def generate_dataset(self):
        market_df = self.fetch_market_data()
        if market_df.empty: return pd.DataFrame()

        final_records = []
        print("⚙️ İş kuralları uygulanıyor...")

        for date, row in market_df.iterrows():
            usd_try_rate = float(row['USD_TRY'])
            prod_vol = self.rules.calculate_production_volume()
            sales_vol = self.rules.calculate_sales_volume(prod_vol)
            current_steel_price_usd = 750 + np.random.normal(0, 40)
            base_labor_try = 25000 * (usd_try_rate / 10)

            # Maliyetler
            mat_cost = self.rules.calculate_raw_material_cost(current_steel_price_usd, usd_try_rate, prod_vol)
            energy_cost = self.rules.calculate_energy_cost(2.8, usd_try_rate, prod_vol)
            labor_total = self.rules.calculate_labor_cost(base_labor_try)
            other_parts_cost = (self.rules.BASE_COMPONENTS_COST_USD * usd_try_rate) * prod_vol

            total_cost = self.rules.calculate_total_cost(mat_cost, energy_cost, labor_total) + other_parts_cost

            # Gelir
            unit_sales_price_usd = self.rules.calculate_sales_price(current_steel_price_usd)
            total_revenue = sales_vol * unit_sales_price_usd * usd_try_rate

            profit = self.rules.calculate_profit(total_revenue, total_cost)
            margin = self.rules.calculate_margin(profit, total_revenue)

            final_records.append({
                'Date': date.strftime('%Y-%m-%d'),
                'USD_TRY': round(usd_try_rate, 4),
                'Steel_Price_USD': round(current_steel_price_usd, 2),
                'Production_Volume': prod_vol,
                'Sales_Volume': sales_vol,
                'Total_Revenue_TRY': round(total_revenue, 2),
                'Total_Cost_TRY': round(total_cost, 2),
                'Net_Profit_TRY': round(profit, 2),
                'Profit_Margin': round(margin, 2)
            })
        return pd.DataFrame(final_records)

    def save_data(self, df):
        file_path = os.path.join(self.output_dir, "financial_data.csv")
        df.to_csv(file_path, index=False)
        print(f"🚀 DOSYA OLUŞTURULDU: {file_path}")


if __name__ == "__main__":
    gen = FinancialDataGenerator(months=36)
    data = gen.generate_dataset()
    gen.save_data(data)