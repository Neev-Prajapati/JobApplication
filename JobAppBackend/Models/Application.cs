using System;

namespace JobAppBackend.Models
{
    public class Application
    {
        public int Id { get; set; }
        public string Position { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = "Raw";
        public DateTime SubmittedAt { get; set; } = DateTime.Now;
    }
}
