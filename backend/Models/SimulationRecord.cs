using System.ComponentModel.DataAnnotations;

public class SimulationRecord
{
    [Key]
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Girdiler
    public double UsdRate { get; set; }
    public double SteelPrice { get; set; }
    public double UsdChangeInput { get; set; }

    // Sonuçlar (Python'dan gelenler)
    public double OriginalProfit { get; set; }
    public double SimulatedProfit { get; set; }
    public double ImpactPct { get; set; }
    public string RecommendationsJson { get; set; } // Tavsiyeleri metin olarak  saklayacağız
                                                    
    public int UserId { get; set; }                     
}   
