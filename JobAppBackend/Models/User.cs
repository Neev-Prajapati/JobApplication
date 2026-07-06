using System;

namespace JobAppBackend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class AuthRequest
    {
        public string Mobile { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
