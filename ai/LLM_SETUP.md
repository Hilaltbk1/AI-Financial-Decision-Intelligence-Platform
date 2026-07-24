# LLM Setup Guide - Gemini API Entegrasyonu

## Hızlı Kurulum

### 1. API Key Almak

1. [Google AI Studio](https://aistudio.google.com/app/apikey) açın
2. **"Get API Key"** butonuna tıklayın
3. **"Create API Key"** seçin
4. Oluşturulan key'i kopyalayın

### 2. Ortam Değişkenini Ayarlamak

`.env` dosyasını açın ve şu satırı güncelleyin:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

**⚠️ UYARI:** `.env` dosyasını git'e commit etmeyin (zaten `.gitignore`'da var)

### 3. Bağımlılıkları Yüklemek

```bash
pip install -r requirements.txt
```

### 4. API'yi Başlatmak

```bash
python main.py
```

Çıkısı:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## API Endpoint'leri

### `/chat` - LLM Destekli Sohbet

Simülasyon sonuçlarına dayalı CFO seviyesinde analiz.

**Request:**
```json
{
  "user_query": "Kur %40 artarsa ne olur?",
  "sim_context": {
    "simulatedProfit": 125000,
    "impactPct": -8.5,
    "simulatedUnitCost": 450,
    "recommendations": ["Hedge yapılmalı", "Fiyat güncelleme"],
    "details": {
      "USD_TRY_Change": 40,
      "Steel_Change_USD": 5,
      "Production_Volume": 1100,
      "Margin_Pct": 6.8
    }
  }
}
```

**Response:**
```json
{
  "answer": "Kur artışı ithal çelik maliyetlerini artırdığı için brüt marj üzerinde baskı oluşmaktadır. Simülasyona göre net kâr %8,7 düşmektedir...",
  "source": "llm"
}
```

### `/report` - Strateji Raporu (LLM ile)

Simülasyon parametrelerinden tam CFO raporu oluştur.

**Request:**
```json
{
  "base_data": {
    "USD_TRY": 35.5,
    "Steel_Price_USD": 450,
    "Production_Volume": 1000,
    "Sales_Volume": 950,
    "Unit_Labor_Cost_TRY": 150,
    "USD_TRY_Change": 0.5,
    "Steel_Change_USD": -2,
    "USD_TRY_MA3": 35.2,
    "Last_Month_Profit": 120000,
    "Last_Month_Margin": 8.5,
    "Unit_Cost_Total_TRY": 450,
    "Month": 7,
    "Net_Profit_TRY": 125000
  },
  "usd_change": 2.0,
  "steel_change": 5.0,
  "production_change": 0.0
}
```

**Response:**
```json
{
  "report": "Mevcut senaryo altında şirketimiz ithal hammadde maliyetleri nedeniyle margin baskısı yaşayacaktır...",
  "simulation_summary": {
    "profit": 125000,
    "impact": -8.5,
    "margin": 6.8
  }
}
```

---

## Frontend'den Kullanım

React Dashboard'da `/chat` endpoint'i kullanılıyor:

```javascript
const response = await fetch("http://localhost:8000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_query: "Kur %40 artarsa ne olur?",
    sim_context: {
      simulatedProfit: 125000,
      impactPct: -8.5,
      // ... diğer veriler
    }
  })
});

const data = await response.json();
console.log(data.answer); // CFO'nun yanıtı
```

---

## Sorun Giderme

### LLM Servisi başlatılamadı hatası

```
⚠️ LLM Service başlatılamadı: GEMINI_API_KEY ortam değişkeni ayarlanmamış.
```

**Çözüm:**
1. `.env` dosyasını kontrol edin
2. API key'i doğru şekilde yapıştırdığınızdan emin olun
3. API'yi restart edin

### "Quota exceeded" hatası

Gemini 2.5 Flash ücretsiz kullanım limitine ulaşmış olabilirsiniz.

**Çözüm:**
1. [Google AI Studio Dashboard](https://aistudio.google.com) açın
2. Usage'ı kontrol edin
3. Limitleri reset etmek için sabirlı olun veya paid plan'a geçin

### Rate limiting

Çok hızlı istek gönderiyor olabilirsiniz.

**Çözüm:**
```python
import time
time.sleep(1)  # İstekler arasında 1 saniye bekle
```

---

## Mimarı Anlamak

```
┌─────────────────────────────────────────────────┐
│         React Dashboard (Chat UI)               │
└─────────────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │   FastAPI Gateway (/chat)      │
         └────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌──────────────────────┐
   │Simulation│ │Recommend │  │ LLMAnalystService    │
   │ Service  │ │ Service  │  │ (Gemini 2.5 Flash)   │
   │(Base ML) │ │(Rules)   │  │ • CFO Context        │
   └─────────┘ └─────────┘  │ • Strategic Analysis │
                             │ • Risk Assessment    │
                             └──────────────────────┘
                                     │
                                     ▼
                             ┌──────────────────┐
                             │  Google Gemini   │
                             │  2.5 Flash API   │
                             └──────────────────┘
```

---

## Prompting Teknikleri

### 1. System Context
LLM'e CFO rolü ve şirket profili verilir. Bkz: `_build_system_context()`.

### 2. Few-Shot Examples (İsteğe Bağlı Geliştirme)
Örnek yanıtlar vererek kaliteyi artırabilirsiniz.

### 3. Structured Output
JSON formatında çıkış isteyebilirsiniz (gelecek sürüm).

---

## Maliyetler

### Gemini 2.5 Flash - Ücretsiz Tier:
- 1.5 milyon input tokens/dakika
- 1 milyon output tokens/dakika
- Tipik bir sohbet: 2-5 bin token

**Hesaplama:**
- 1 sohbet ≈ 3 bin token
- Günde 100 sohbet ≈ 300 bin token
- **Ücretsiz kullanım için yeterli** ✅

---

## Gelecek Adımlar

1. ✅ Gemini API entegrasyonu
2. ⬜ Chat history persistency (MongoDB/PostgreSQL)
3. ⬜ Multi-turn conversations (memory management)
4. ⬜ Financial document ingestion (PDF, Excel parsing)
5. ⬜ Real-time data feeds (market data APIs)
6. ⬜ Dashboard visualization of LLM insights

---

## Kaynaklar

- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)
- [Gemini API Docs](https://ai.google.dev/tutorials)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
