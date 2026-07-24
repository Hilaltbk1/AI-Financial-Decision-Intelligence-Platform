using FinancialIntelligence.Gateway.Services;
using Microsoft.EntityFrameworkCore;
using FinancialIntelligence.Gateway.Data;
using FinancialIntelligence.Gateway.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. SERVİS KAYITLARI (DEPENDENCY INJECTION) ---

// Python API köprüsü
builder.Services.AddHttpClient<PythonApiService>();

// SQL Server Veritabanı bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// API Controller'ları ve JSON Ayarları
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddRazorPages();

// Market servisleri
builder.Services.AddSingleton<MarketService>();
builder.Services.AddHostedService<MarketWorker>();

// JWT Token Service
builder.Services.AddSingleton<TokenService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters =
        new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey =
                new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                    System.Text.Encoding.UTF8.GetBytes(jwtKey)),

            // Sunucu ile tarayıcı arasındaki anlık milisaniyelik saat farklarını tolerans etmek için
            // varsayılan 5 dakikalık tolerans payını aktif tutuyoruz.
            ClockSkew = TimeSpan.FromMinutes(5)
        };
});

// CORS
// Geliştirmede AllowAll rahatlık sağlar ama production'da herhangi bir
// sitenin API'ye tarayıcıdan istek atabilmesine izin vermek istemeyiz.
// Bu yüzden production'da appsettings.json > "Cors:AllowedOrigins" içindeki
// (ör: https://decisionos.sirketiniz.com) origin'lerle sınırlıyoruz.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        if (builder.Environment.IsDevelopment() || allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

// --- 2. UYGULAMA İNŞASI ---

var app = builder.Build();

// --- 3. MIDDLEWARE ---

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json",
            "Financial Gateway API V1");
    });
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// Routing
app.UseRouting();

// CORS
app.UseCors("AllowAll");

// Authentication (ÖNCE)
app.UseAuthentication();

// Authorization (SONRA)
app.UseAuthorization();

// Controller'lar
app.MapControllers();
app.MapRazorPages();

// Demo CFO kullanıcısı oluştur
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Users.Any())
    {
        var demoPassword = app.Configuration["SeedData:DemoPassword"] ?? "Cfo12345!";

        db.Users.Add(new User
        {
            Username = "cfo",
            Email = "cfo@decisionos.com", // <-- BU SATIRI EKLEYİN (Zorunlu alan olduğu için boş geçmiyoruz)
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoPassword),
            Role = "CFO"
        });

        db.SaveChanges();
    }
}

app.Run();