import pandas as pd
import numpy as np

# Projenin beklediği kolon isimleri
columns = [
    'USD_TRY', 'Steel_Price_USD', 'Production_Volume', 'Sales_Volume',
    'Unit_Labor_Cost_TRY', 'USD_TRY_Change', 'Steel_Change_USD',
    'USD_TRY_MA3', 'Last_Month_Profit', 'Last_Month_Margin',
    'Unit_Cost_Total_TRY', 'Month', 'Net_Profit_TRY'
]

# 12 aylık (1 yıl) veri üretelim
data = []
for i in range(1, 13):
    row = {
        'USD_TRY': 30 + (i * 0.5),
        'Steel_Price_USD': 800 + (i * 10),
        'Production_Volume': 1000 + (i * 20),
        'Sales_Volume': 950 + (i * 20),
        'Unit_Labor_Cost_TRY': 20000 + (i * 1000),
        'USD_TRY_Change': 0.02,
        'Steel_Change_USD': 0.01,
        'USD_TRY_MA3': 32.0,
        'Last_Month_Profit': 70000000.0,
        'Last_Month_Margin': 8.5,
        'Unit_Cost_Total_TRY': 600000.0 + (i * 5000),
        'Month': i,
        'Net_Profit_TRY': 75000000.0 + (i * 2000000) # Hedef değişken
    }
    data.append(row)

df = pd.DataFrame(data)
df.to_csv("sirket_b_verileri.csv", index=False)
print("✅ Test için 'sirket_b_verileri.csv' dosyası kök dizinde oluşturuldu!")