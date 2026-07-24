using System.Text.Json.Serialization;
using System.Collections.Generic;
using System;

namespace FinancialIntelligence.Gateway.Models
{
    // 1. CANLI PİYASA MODELİ (MarketService'in aradığı sınıf)
    public class LiveMarketData
    {
        // MarketService'deki isimlerle birebir eşledim
        [JsonPropertyName("usdTry")] public double UsdTry { get; set; }
        [JsonPropertyName("steelUsd")] public double SteelUsd { get; set; }
        [JsonPropertyName("eurTry")] public double EurTry { get; set; }
        [JsonPropertyName("lastUpdate")] public DateTime LastUpdate { get; set; }
    }

    // 2. ANA VERİ MODELİ (Şirket Verileri)
    public class BaseDataDto
    {
        [JsonPropertyName("usdRate")] public double UsdRate { get; set; }
        [JsonPropertyName("steelPrice")] public double SteelPrice { get; set; }
        [JsonPropertyName("productionVolume")] public int ProductionVolume { get; set; }
        [JsonPropertyName("salesVolume")] public int SalesVolume { get; set; }
        [JsonPropertyName("laborCost")] public double LaborCost { get; set; }
        [JsonPropertyName("usdChange")] public double UsdChange { get; set; }
        [JsonPropertyName("steelChange")] public double SteelChange { get; set; }
        [JsonPropertyName("usdMa3")] public double UsdMa3 { get; set; }
        [JsonPropertyName("lastProfit")] public double LastProfit { get; set; }
        [JsonPropertyName("lastMargin")] public double LastMargin { get; set; }
        [JsonPropertyName("unitCost")] public double UnitCost { get; set; }
        [JsonPropertyName("month")] public int Month { get; set; }
        [JsonPropertyName("netProfit")] public double NetProfit { get; set; }
    }

    // 3. SİMÜLASYON MODELLERİ
    public class SimulationScenarioDto
    {
        [JsonPropertyName("baseData")] public BaseDataDto BaseData { get; set; }
        [JsonPropertyName("usdChange")] public double UsdChange { get; set; }
        [JsonPropertyName("steelChange")] public double SteelChange { get; set; }
        [JsonPropertyName("productionChange")] public double ProductionChange { get; set; }
    }

    public class SimulationResultDto
    {
        [JsonPropertyName("originalProfit")] public double OriginalProfit { get; set; }
        [JsonPropertyName("simulatedProfit")] public double SimulatedProfit { get; set; }
        [JsonPropertyName("impactPct")] public double ImpactPct { get; set; }
        [JsonPropertyName("simulatedUnitCost")] public double SimulatedUnitCost { get; set; }
        [JsonPropertyName("simulatedUsdRate")] public double SimulatedUsdRate { get; set; }
        [JsonPropertyName("recommendations")] public List<string> Recommendations { get; set; }
        [JsonPropertyName("driverData")] public List<DriverDataDto> DriverData { get; set; }
    }

    public class DriverDataDto
    {
        [JsonPropertyName("name")] public string Name { get; set; }
        [JsonPropertyName("value")] public double Value { get; set; }
    }

    // 4. OPTİMİZASYON (TARGET FINDER) MODELLERİ
    public class OptimizeRequestDto
    {
        [JsonPropertyName("baseData")] public BaseDataDto BaseData { get; set; }
        [JsonPropertyName("targetProfit")] public double TargetProfit { get; set; }
        [JsonPropertyName("userId")] public int UserId { get; set; }
    }

    public class OptimizeResponseDto
    {
        [JsonPropertyName("usdChange")] public double UsdChange { get; set; }
        [JsonPropertyName("steelChange")] public double SteelChange { get; set; }
        [JsonPropertyName("productionChange")] public double ProductionChange { get; set; }
        [JsonPropertyName("simulatedProfit")] public double SimulatedProfit { get; set; }
        [JsonPropertyName("impactPct")] public double ImpactPct { get; set; }

        // YENİ: AI'nın yazdığı metni almak için bu şart!
        [JsonPropertyName("ai_summary")] public string AiSummary { get; set; }
    }

    // 5. CHAT (AI ASİSTAN) MODELLERİ
    public class ChatRequestDto
    {
        [JsonPropertyName("user_query")] public string UserQuery { get; set; }
        [JsonPropertyName("sim_context")] public SimulationResultDto SimContext { get; set; }
    }

    public class ChatResponseDto
    {
        [JsonPropertyName("answer")] public string Answer { get; set; }
        [JsonPropertyName("action")] public object Action { get; set; }
    }

    // FinancialDtos.cs dosyasının içine ekle:

    public class TrainResponseDto
    {
        [JsonPropertyName("new_mae")]
        public double NewMae { get; set; }

        [JsonPropertyName("improvement_pct")]
        public double ImprovementPct { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("is_anomaly")]
        public bool IsAnomaly { get; set; }

        [JsonPropertyName("drift_report")]
        public string DriftReport { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("blindSpots")]
        public List<BlindSpotDto> BlindSpots { get; set; }
    }

    public class BlindSpotDto
    {
        [JsonPropertyName("column")]
        public string Column { get; set; }

        [JsonPropertyName("correlation")]
        public double Correlation { get; set; }
    }
    public class ExplainResponseDto
    {
        [JsonPropertyName("baseValue")]
        public double BaseValue { get; set; }

        [JsonPropertyName("prediction")]
        public double Prediction { get; set; }

        [JsonPropertyName("contributions")]
        public List<ContributionDto> Contributions { get; set; }
    }

    public class ContributionDto
    {
        [JsonPropertyName("feature")]
        public string Feature { get; set; }

        [JsonPropertyName("value")]
        public double Value { get; set; }
    }
}