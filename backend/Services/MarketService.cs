using FinancialIntelligence.Gateway.Models;

namespace FinancialIntelligence.Gateway.Services
{
    public class MarketService
    {
        private LiveMarketData _currentData = new LiveMarketData
        {
            UsdTry = 34.55,
            SteelUsd = 820.0,
            EurTry = 37.40,
            LastUpdate = DateTime.Now
        };

        public LiveMarketData GetLivePrices() => _currentData;

        public void UpdatePrices(double usd, double steel, double eur)
        {
            _currentData.UsdTry = usd;
            _currentData.SteelUsd = steel;
            _currentData.EurTry = eur;
            _currentData.LastUpdate = DateTime.Now;
        }
    }
}