using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FinancialIntelligence.Gateway.Models;

namespace FinancialIntelligence.Gateway.Services
{
    public class TokenService
    {
        private readonly IConfiguration _config;
        public TokenService(IConfiguration config) => _config = config;

        public string GenerateToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // EMNİYET BARİYERİ: appsettings.json'da süre tanımlanmamışsa veya 1 günden (1440 dk) 
            // daha kısa ayarlanmışsa, demoda yarıda kesilmemesi için varsayılanı 7 GÜNE (10080 dakika) çekiyoruz.
            if (!double.TryParse(_config["Jwt:ExpiresMinutes"], out double expiresMinutes) || expiresMinutes < 1440)
            {
                expiresMinutes = 10080; // 7 Gün Emniyet Süresi
            }

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}