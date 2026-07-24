using System.ComponentModel.DataAnnotations;

namespace FinancialIntelligence.Gateway.Models
{
    public class StrategyDocument
    {
        [Key]
        public int Id { get; set; }
        public string FileName { get; set; }
        public string Content { get; set; } // PDF'in içinden çıkan dev metin burada saklanacak
        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public int UserId { get; set; }
    }
}