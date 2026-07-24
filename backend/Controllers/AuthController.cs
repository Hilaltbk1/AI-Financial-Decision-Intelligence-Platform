using Microsoft.AspNetCore.Mvc;
using FinancialIntelligence.Gateway.Data;
using FinancialIntelligence.Gateway.Models;
using FinancialIntelligence.Gateway.Services;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Net;
using System.Net.Mail;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _config; // <-- Dinamik ayar okuyucu eklendi

    // Constructor içerisinden IConfiguration servisini enjekte ediyoruz
    public AuthController(AppDbContext context, TokenService tokenService, IConfiguration config)
    {
        _context = context;
        _tokenService = tokenService;
        _config = config; // <-- Atama yapıldı
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı." });

        var token = _tokenService.GenerateToken(user);
        return Ok(new LoginResponseDto { Token = token, Username = user.Username, Role = user.Role });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequestDto request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "Lütfen tüm alanları doldurun." });

        if (_context.Users.Any(u => u.Username.ToLower() == request.Username.ToLower() || u.Email.ToLower() == request.Email.ToLower()))
            return BadRequest(new { message = "Kullanıcı adı veya e-posta adresi zaten alınmış." });

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "CFO"
        };

        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { message = "Kayıt başarılı, şimdi giriş yapabilirsiniz." });
    }

    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null)
        {
            return Ok(new { message = "Eğer e-posta sistemimizde kayıtlıysa sıfırlama bağlantısı gönderilmiştir." });
        }

        user.PasswordResetToken = Guid.NewGuid().ToString();
        user.ResetTokenExpires = DateTime.UtcNow.AddHours(1);
        _context.SaveChanges();

        try
        {
            SendResetEmail(user.Email, user.PasswordResetToken);
        }
        catch (Exception ex)
        {
            var detail = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { message = "E-posta gönderilirken teknik bir hata oluştu: " + detail });
        }

        return Ok(new { message = "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." });
    }

    [HttpPost("reset-password")]
    public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.PasswordResetToken == dto.Token);

        if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.ResetTokenExpires = null;
        _context.SaveChanges();

        return Ok(new { message = "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
    }

    // SMTP Gönderme Yardımcısı (Artık enjekte edilen _config nesnesini güvenle kullanıyor)
    private void SendResetEmail(string email, string token)
    {
        // Dosya okumakla uğraşmadan doğrudan appsettings.json'daki SMTP ayarlarını okuyoruz
        var smtpConfig = _config.GetSection("SmtpSettings");

        var client = new SmtpClient(smtpConfig["Server"])
        {
            Port = int.Parse(smtpConfig["Port"] ?? "2525"),
            Credentials = new NetworkCredential(smtpConfig["Username"], smtpConfig["Password"]),
            EnableSsl = true,
        };

        string resetLink = $"http://localhost:5173/reset-password?token={token}";

        var mailMessage = new MailMessage
        {
            From = new MailAddress(smtpConfig["SenderEmail"], smtpConfig["SenderName"]),
            Subject = "DecisionOS - Şifre Sıfırlama Talebi",
            Body = $"<h3>Şifrenizi Sıfırlayın</h3>" +
                   $"<p>DecisionOS platformu şifre sıfırlama talebinde bulundunuz.</p>" +
                   $"<p>Şifrenizi sıfırlamak için lütfen aşağıdaki bağlantıya tıklayın (Bu bağlantı 1 saat geçerlidir):</p>" +
                   $"<a href='{resetLink}'>Şifremi Sıfırla</a>" +
                   $"<p>Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>",
            IsBodyHtml = true,
        };

        mailMessage.To.Add(email);
        client.Send(mailMessage);
    }
}