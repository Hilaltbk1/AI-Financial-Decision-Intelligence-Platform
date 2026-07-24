using System.Text.Json;
using System.Text;
using FinancialIntelligence.Gateway.Models;

namespace FinancialIntelligence.Gateway.Services
{
    public class PythonApiService
    {
        private readonly HttpClient _httpClient;

        public PythonApiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            // appsettings.json içinde "PythonApi:BaseUrl" tanımlı değilse
            // geliştirme ortamı için localhost'a düşer. Production'da
            // appsettings.Production.json veya ortam değişkeni ile
            // gerçek adres verilmeli (ör: http://python-service:8000).
            var baseUrl = config["PythonApi:BaseUrl"] ?? "http://127.0.0.1:8000";
            _httpClient.BaseAddress = new Uri(baseUrl);
        }

        public async Task<SimulationResultDto> GetSimulationAsync(SimulationScenarioDto scenario)
        {
            var response = await _httpClient.PostAsJsonAsync("/simulate", scenario);
            response.EnsureSuccessStatusCode();

            // Python snake_case gönderiyor, biz onu otomatik eşleştiriyoruz
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return await response.Content.ReadFromJsonAsync<SimulationResultDto>(options);
        }
        public async Task<ExplainResponseDto> GetExplanationAsync(SimulationScenarioDto scenario)
        {
            var response = await _httpClient.PostAsJsonAsync("/explain", scenario);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Python'dan hata döndü: {response.StatusCode} - {error}");
            }
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return await response.Content.ReadFromJsonAsync<ExplainResponseDto>(options);
        }

        // PythonApiService.cs içindeki UploadPdfAsync metodunu bununla değiştir:
        public async Task<string> UploadPdfAsync(Stream fileStream, string fileName, int userId)
        {
            using var content = new MultipartFormDataContent();

            using var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms);
            var fileBytes = ms.ToArray();

            var fileContent = new ByteArrayContent(fileBytes);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");

            content.Add(fileContent, "file", fileName);
            content.Add(new StringContent(userId.ToString()), "user_id");   // <-- yeni eklenen alan

            var response = await _httpClient.PostAsync("/upload-strategy", content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Python'dan hata döndü: {response.StatusCode} - {error}");
            }

            return await response.Content.ReadFromJsonAsync<string>();
        }

        public async Task<LiveMarketData> GetMarketFromPythonAsync()
        {
            // Python'daki @app.get("/market/live") ile aynı
            return await _httpClient.GetFromJsonAsync<LiveMarketData>("/market/live");
        }
        public async Task<TResponse> PostToPythonAsync<TResponse>(string endpoint, object data)
        {
            var response = await _httpClient.PostAsJsonAsync(endpoint, data);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<TResponse>(new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

    }

}