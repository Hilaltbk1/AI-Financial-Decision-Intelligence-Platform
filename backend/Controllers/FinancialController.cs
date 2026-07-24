using FinancialIntelligence.Gateway.Data;
using FinancialIntelligence.Gateway.Models;
using FinancialIntelligence.Gateway.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinancialController : ControllerBase
{
    private readonly PythonApiService _pythonService;
    private readonly AppDbContext _context;

    public FinancialController(PythonApiService pythonService, AppDbContext context)
    {
        _pythonService = pythonService;
        _context = context;
    }

    [HttpPost("executive-report")]
    public async Task<IActionResult> GetExecutiveReport([FromBody] JsonElement request)
    {
        try
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            var userId = _context.Users.First(u => u.Username == username).Id;

            var requestDict = JsonSerializer.Deserialize<Dictionary<string, object>>(request.GetRawText());
            requestDict["user_id"] = userId;

            // PythonApiService generic 'PostToPythonAsync' metodunu doğrudan kullanıyoruz
            var response = await _pythonService.PostToPythonAsync<JsonElement>("/executive-report", requestDict);
            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Executive Report Hatası: {ex.Message}");
            return StatusCode(500, new { report = "Rapor şu an oluşturulamadı. Lütfen backend bağlantısını kontrol edin." });
        }
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulationScenarioDto scenario)
    {
        try
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            var userId = _context.Users.First(u => u.Username == username).Id;

            var result = await _pythonService.GetSimulationAsync(scenario);
            var record = new SimulationRecord
            {
                CreatedAt = DateTime.Now,
                UsdRate = scenario.BaseData.UsdRate,
                SteelPrice = scenario.BaseData.SteelPrice,
                UsdChangeInput = scenario.UsdChange,
                OriginalProfit = result.OriginalProfit,
                SimulatedProfit = result.SimulatedProfit,
                ImpactPct = result.ImpactPct,
                RecommendationsJson = JsonSerializer.Serialize(result.Recommendations),
                UserId = userId
            };
            _context.SimulationHistories.Add(record);
            await _context.SaveChangesAsync();
            return Ok(result);
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }
    [HttpPost("explain")]
    public async Task<IActionResult> Explain([FromBody] SimulationScenarioDto scenario)
    {
        try
        {
            var result = await _pythonService.GetExplanationAsync(scenario);
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Explain Hatası: {ex.Message}");
            return StatusCode(500, $"Açıklama alınamadı: {ex.Message}");
        }
    }


    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] System.Text.Json.JsonElement request)
    {
        try
        {
            var username = User.FindFirstValue(System.Security.Claims.ClaimTypes.Name);
            var userId = _context.Users.First(u => u.Username == username).Id;

            // Gelen JSON'u dict'e çeviriyoruz, userId'yi ekliyoruz, tekrar gönderiyoruz
            var requestDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(request.GetRawText());
            requestDict["user_id"] = userId;

            var response = await _pythonService.PostToPythonAsync<ChatResponseDto>("/chat", requestDict);
            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Chat Hatası: {ex.Message}");
            return StatusCode(500, new { answer = "AI şu an cevap veremiyor, lütfen simülasyonu oynatıp tekrar deneyin." });
        }
    }

    [HttpGet("history")]
    public IActionResult GetHistory()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var userId = _context.Users.First(u => u.Username == username).Id;

        var history = _context.SimulationHistories
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .ToList();
        return Ok(history);
    }

    [HttpPost("optimize")]
    public async Task<IActionResult> Optimize([FromBody] OptimizeRequestDto request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var userId = _context.Users.First(u => u.Username == username).Id;
        request.UserId = userId;

        var response = await _pythonService.PostToPythonAsync<OptimizeResponseDto>("/optimize", request);
        return Ok(response);
    }

    [HttpPost("upload-pdf")]
    public async Task<IActionResult> UploadPdf(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Dosya yok.");

        try
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            var userId = _context.Users.First(u => u.Username == username).Id;

            using var stream = file.OpenReadStream();
            string extractedText = await _pythonService.UploadPdfAsync(stream, file.FileName, userId);
            // 2. SQL Server'a Kaydet (Persistence)
            var doc = new StrategyDocument
            {
                FileName = file.FileName,
                Content = extractedText,
                UploadedAt = DateTime.Now,
                UserId = userId
            };
            _context.StrategyDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Belge SQL ve Vektör DB'ye kalıcı olarak işlendi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Kayıt Hatası: {ex.Message}");
        }
    }

    // Python'ın açılışta çağırdığı liste endpoint'i
    [HttpGet("documents")]
    public IActionResult GetMyDocuments()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var userId = _context.Users.First(u => u.Username == username).Id;
        var docs = _context.StrategyDocuments.Where(d => d.UserId == userId).ToList();
        return Ok(docs);
    }
    // Bu uç nokta artık [AllowAnonymous] DEĞİL: herkese açık bırakıldığında
    // tüm kullanıcıların stratejik belgeleri kimlik doğrulaması olmadan
    // okunabiliyordu. Bunun yerine sadece Python servisinin bildiği,
    // appsettings.json / ortam değişkeninde tutulan bir "Internal:ServiceKey"
    // ile korunuyor. Bu key JWT değildir, sadece servisler-arası (S2S) çağrı
    // için kullanılır ve dışarıya (frontend'e) asla verilmez.
    [AllowAnonymous]
    [HttpGet("documents/all-internal")]
    public IActionResult GetAllDocumentsInternal([FromServices] IConfiguration config)
    {
        var expectedKey = config["Internal:ServiceKey"];

        if (string.IsNullOrEmpty(expectedKey) ||
            !Request.Headers.TryGetValue("X-Internal-Key", out var providedKey) ||
            providedKey != expectedKey)
        {
            return Unauthorized(new { message = "Bu uç nokta yalnızca dahili servisler içindir." });
        }

        var docs = _context.StrategyDocuments.ToList();
        return Ok(docs);
    }

    [HttpPost("train")]
    public async Task<IActionResult> Train([FromBody] List<Dictionary<string, object>> newData)
    {
        try
        {
            var result = await _pythonService.PostToPythonAsync<TrainResponseDto>("/train", newData);
            return Ok(result);
        }

        catch (Exception ex)
        {
            return StatusCode(500, $"Eğitim Hatası: {ex.Message}");
        }
    }
    [Authorize(Roles = "CFO")]
    [HttpPost("approve-model")]
    public async Task<IActionResult> ApproveModel([FromBody] bool isApproved)
    {
        if (!isApproved)
        {
            return Ok(new { message = "Model reddedildi. Eski stabil sürümle devam ediliyor." });
        }

        try
        {
            var result = await _pythonService.PostToPythonAsync<object>("/approve-model", new { });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Model Onay Hatası: {ex.Message}");
        }
    }
}