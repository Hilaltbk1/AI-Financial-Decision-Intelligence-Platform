using System.ComponentModel.DataAnnotations;

namespace FinancialIntelligence.Gateway.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } = "User";

        public string Email { get; set; } // Kullanıcının e-posta adresi
        public string? PasswordResetToken { get; set; } // Şifre sıfırlama token'ı
        public DateTime? ResetTokenExpires { get; set; } // Token'ın son kullanma tarihi
    }
}