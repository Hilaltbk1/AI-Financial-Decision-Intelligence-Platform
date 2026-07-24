import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os


def run_eda():
    # 1. Veriyi Yükle
    df = pd.read_csv("generators/data/raw/financial_data.csv")
    df['Date'] = pd.to_datetime(df['Date'])

    print("📊 Veri Seti Özeti:")
    print(df.describe())

    # Klasör kontrolü
    os.makedirs("docs/visuals", exist_ok=True)

    # 2. Korelasyon Matrisi (Heatmap)
    # Hangi faktör Net Kârı daha çok etkiliyor?
    plt.figure(figsize=(12, 8))
    correlation_matrix = df.drop(columns=['Date']).corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='RdYlGn', fmt=".2f")
    plt.title("Finansal Değişkenler Arasındaki Korelasyon")
    plt.savefig("docs/visuals/correlation_heatmap.png")
    print("✅ Korelasyon matrisi kaydedildi: docs/visuals/correlation_heatmap.png")

    # 3. Zaman Serisi Analizi: Kur vs Kâr
    fig, ax1 = plt.subplots(figsize=(14, 7))

    ax2 = ax1.twinx()
    ax1.plot(df['Date'], df['Net_Profit_TRY'], 'g-', label='Net Kâr (TRY)')
    ax2.plot(df['Date'], df['USD_TRY'], 'b--', label='USD/TRY Kuru')

    ax1.set_xlabel('Tarih')
    ax1.set_ylabel('Net Kâr', color='g')
    ax2.set_ylabel('Dolar Kuru', color='b')
    plt.title("Dolar Kuru ve Net Kâr Değişimi")

    plt.savefig("docs/visuals/profit_vs_usd.png")
    print("✅ Trend grafiği kaydedildi: docs/visuals/profit_vs_usd.png")

    plt.show()


if __name__ == "__main__":
    run_eda()