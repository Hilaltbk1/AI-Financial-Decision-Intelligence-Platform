namespace FinancialIntelligence.Gateway.Services
{
    public class MarketWorker : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<MarketWorker> _logger;

        public MarketWorker(IServiceProvider services, ILogger<MarketWorker> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _services.CreateScope())
                {
                    var pythonService = scope.ServiceProvider.GetRequiredService<PythonApiService>();
                    var marketService = scope.ServiceProvider.GetRequiredService<MarketService>();

                    try
                    {

                        _logger.LogInformation("Piyasa verileri güncelleniyor...");
                        var liveData = await pythonService.GetMarketFromPythonAsync();
                        marketService.UpdatePrices(liveData.UsdTry, liveData.SteelUsd, liveData.EurTry);
                    }
                    catch (Exception ex) { _logger.LogError($"Worker Hatası: {ex.Message}"); }
                }
                await Task.Delay(60000, stoppingToken); // 60 saniyede bir çalışır
            }
        }
    }
}