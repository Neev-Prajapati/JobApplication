namespace JobAppBackend.Models
{
    public class ApplicationDetails
    {
        public int Id { get; set; }
        public int ApplicationId { get; set; }
        public string? LocationData { get; set; } // JSON string
        public string? ExperienceData { get; set; } // JSON string
        public string? TextResponses { get; set; } // JSON string
    }
}
