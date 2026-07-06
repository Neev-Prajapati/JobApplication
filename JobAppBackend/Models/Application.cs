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
        public string? FromState { get; set; }
        public string? FromCity { get; set; }
        public string? BasedState { get; set; }
        public string? BasedCity { get; set; }
        public int WorkExperienceYears { get; set; }
        public int WorkExperienceMonths { get; set; }
        public bool IsCurrentlyEmployed { get; set; }
        public string? Employer { get; set; }
        public decimal? Salary { get; set; }
        public decimal? ExpectedSalary { get; set; }
        public DateTime JoiningDate { get; set; }
        public string? RecentLearning { get; set; }
        public string? WhyHireYou { get; set; }
        public string Status { get; set; } = "Raw";
        public DateTime SubmittedAt { get; set; } = DateTime.Now;
    }
}
