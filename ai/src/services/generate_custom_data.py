import pandas as pd
import numpy as np

# Projenin beklediği tam uyumlu kolon isimleri (camelCase)
columns = [
    'usdRate', 'steelPrice', 'productionVolume', 'salesVolume',
    'laborCost', 'usdChange', 'steelChange', 'usdMa3',
    'lastProfit', 'lastMargin', 'unitCost', 'month', 'netProfit'
]

# 24 aylık (2 yıl) veri üretelim - Şirket B (Daha kârlı bir model)
data = []
for i in range(1, 25):
    usd = 30 + (i * 0.2)
    steel = 750 + (i * 5)
    prod = 1300 + (i * 10)

    # Bu şirket daha az fire veriyor ve daha yüksek marjla çalışıyor
    row = {
        'usdRate': round(usd, 4),
        'steelPrice': round(steel, 2),
        'productionVolume': prod,
        'salesVolume': int(prod * 0.98),  # %98 satış başarısı
        'laborCost': round(18000 * (usd / 25), 2),
        'usdChange': 0.01,
        'steelChange': 0.005,
        'usdMa3': round(usd - 0.5, 2),
        'lastProfit': 100000000.0 + (i * 1000000),
        'lastMargin': 12.5,
        'unitCost': round(400000 + (steel * 1.2), 2),
        'month': (i % 12) + 1,
        'netProfit': round(120000000.0 + (i * 3000000), 2)  # Hedef değişken
    }
    data.append(row)

df = pd.DataFrame(data)
# CSV olarak kaydet
df.to_csv("sirket_b_ozel_veriler.csv", index=False)
print("✅ 'sirket_b_ozel_veriler.csv' başarıyla oluşturuldu!")