using Microsoft.AspNetCore.Mvc;
using FinancialIntelligence.Gateway.Services;

namespace FinancialIntelligence.Gateway.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketController : ControllerBase
    {
        private readonly MarketService _marketService;
        public MarketController(MarketService marketService) => _marketService = marketService;

        [HttpGet("live")] // URL: https://localhost:7283/api/market/live
        public IActionResult GetLive() => Ok(_marketService.GetLivePrices());
    }
}