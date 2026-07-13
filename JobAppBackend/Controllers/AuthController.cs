using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using JobAppBackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace JobAppBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRequest request)
        {
            if (string.IsNullOrEmpty(request.Mobile) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Mobile and password are required." });
            }

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                int newUserId = 0;

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    
                    // Check if user already exists
                    string checkSql = "SELECT COUNT(1) FROM Users WHERE MobileNumber = @Mobile";
                    using (SqlCommand checkCmd = new SqlCommand(checkSql, connection))
                    {
                        checkCmd.Parameters.AddWithValue("@Mobile", request.Mobile);
                        int count = (int)await checkCmd.ExecuteScalarAsync();
                        if (count > 0)
                        {
                            return BadRequest(new { message = "User with this mobile number already exists." });
                        }
                    }

                    // Insert new user and get Id
                    string sql = "INSERT INTO Users (MobileNumber, PasswordHash) OUTPUT INSERTED.Id VALUES (@Mobile, @Hash)";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Mobile", request.Mobile);
                        command.Parameters.AddWithValue("@Hash", passwordHash);
                        newUserId = (int)await command.ExecuteScalarAsync();
                    }
                }

                // Generate token right after registration to auto-login (always false for new users)
                string token = GenerateJwtToken(request.Mobile, false, newUserId);
                return Ok(new { token });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error registering user.", details = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            if (string.IsNullOrEmpty(request.Mobile) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Mobile and password are required." });
            }

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                string storedHash = "";
                bool isAdmin = false;
                int userId = 0;

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    
                    string sql = "SELECT Id, PasswordHash, IsAdmin FROM Users WHERE MobileNumber = @Mobile";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Mobile", request.Mobile);
                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                userId = reader.GetInt32(0);
                                storedHash = reader.GetString(1);
                                isAdmin = reader.GetBoolean(2);
                            }
                        }
                    }
                }

                if (string.IsNullOrEmpty(storedHash) || !BCrypt.Net.BCrypt.Verify(request.Password, storedHash))
                {
                    return Unauthorized(new { message = "Invalid mobile number or password." });
                }

                string token = GenerateJwtToken(request.Mobile, isAdmin, userId);
                return Ok(new { token });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error logging in.", details = ex.Message });
            }
        }

        private string GenerateJwtToken(string mobile, bool isAdmin, int userId)
        {
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_fallback_key_1234567890");
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, mobile),
                new Claim("AdminId", userId.ToString())
            };

            if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return tokenHandler.WriteToken(token);
        }
    }
}
