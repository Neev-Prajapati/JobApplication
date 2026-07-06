using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using JobAppBackend.Models;
using System.Threading.Tasks;

namespace JobAppBackend.Controllers
{
    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ApplicationController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllApplications()
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                var applications = new List<Application>();

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    string sql = "SELECT * FROM Applications ORDER BY SubmittedAt DESC";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                applications.Add(new Application
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Position = reader.GetString(reader.GetOrdinal("Position")),
                                    Name = reader.GetString(reader.GetOrdinal("Name")),
                                    Mobile = reader.GetString(reader.GetOrdinal("Mobile")),
                                    Email = reader.GetString(reader.GetOrdinal("Email")),
                                    WorkExperienceYears = reader.GetInt32(reader.GetOrdinal("WorkExperienceYears")),
                                    WorkExperienceMonths = reader.GetInt32(reader.GetOrdinal("WorkExperienceMonths")),
                                    IsCurrentlyEmployed = reader.GetBoolean(reader.GetOrdinal("IsCurrentlyEmployed")),
                                    Employer = reader.IsDBNull(reader.GetOrdinal("Employer")) ? null : reader.GetString(reader.GetOrdinal("Employer")),
                                    Salary = reader.IsDBNull(reader.GetOrdinal("Salary")) ? null : reader.GetDecimal(reader.GetOrdinal("Salary")),
                                    ExpectedSalary = reader.IsDBNull(reader.GetOrdinal("ExpectedSalary")) ? null : reader.GetDecimal(reader.GetOrdinal("ExpectedSalary")),
                                    JoiningDate = reader.GetDateTime(reader.GetOrdinal("JoiningDate")),
                                    RecentLearning = reader.GetString(reader.GetOrdinal("RecentLearning")),
                                    WhyHireYou = reader.GetString(reader.GetOrdinal("WhyHireYou")),
                                    Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "Raw" : reader.GetString(reader.GetOrdinal("Status")),
                                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("SubmittedAt"))
                                });
                            }
                        }
                    }
                }
                return Ok(applications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching applications.", details = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.Status)) return BadRequest(new { message = "Status is required." });
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    string sql = "UPDATE Applications SET Status = @Status WHERE Id = @Id";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Status", request.Status);
                        command.Parameters.AddWithValue("@Id", id);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        if (rowsAffected == 0) return NotFound(new { message = "Application not found." });
                    }
                }
                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating status.", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteApplication(int id)
        {
            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    string sql = "DELETE FROM Applications WHERE Id = @Id";
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Id", id);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        if (rowsAffected == 0) return NotFound(new { message = "Application not found." });
                    }
                }
                return Ok(new { message = "Application deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting application.", details = ex.Message });
            }
        }

        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> SubmitApplication([FromBody] Application app)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    string sql = @"
                        INSERT INTO Applications (
                            Position, Name, Mobile, Email, FromState, FromCity, BasedState, BasedCity, 
                            WorkExperienceYears, WorkExperienceMonths, IsCurrentlyEmployed, Employer, 
                            Salary, ExpectedSalary, JoiningDate, RecentLearning, WhyHireYou, Status
                        ) VALUES (
                            @Position, @Name, @Mobile, @Email, @FromState, @FromCity, @BasedState, @BasedCity, 
                            @WorkExperienceYears, @WorkExperienceMonths, @IsCurrentlyEmployed, @Employer, 
                            @Salary, @ExpectedSalary, @JoiningDate, @RecentLearning, @WhyHireYou, 'Raw'
                        )";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Position", app.Position);
                        command.Parameters.AddWithValue("@Name", app.Name);
                        command.Parameters.AddWithValue("@Mobile", app.Mobile);
                        command.Parameters.AddWithValue("@Email", app.Email);
                        command.Parameters.AddWithValue("@FromState", (object?)app.FromState ?? DBNull.Value);
                        command.Parameters.AddWithValue("@FromCity", (object?)app.FromCity ?? DBNull.Value);
                        command.Parameters.AddWithValue("@BasedState", (object?)app.BasedState ?? DBNull.Value);
                        command.Parameters.AddWithValue("@BasedCity", (object?)app.BasedCity ?? DBNull.Value);
                        command.Parameters.AddWithValue("@WorkExperienceYears", app.WorkExperienceYears);
                        command.Parameters.AddWithValue("@WorkExperienceMonths", app.WorkExperienceMonths);
                        command.Parameters.AddWithValue("@IsCurrentlyEmployed", app.IsCurrentlyEmployed);
                        command.Parameters.AddWithValue("@Employer", (object?)app.Employer ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Salary", (object?)app.Salary ?? DBNull.Value);
                        command.Parameters.AddWithValue("@ExpectedSalary", (object?)app.ExpectedSalary ?? DBNull.Value);
                        command.Parameters.AddWithValue("@JoiningDate", app.JoiningDate);
                        command.Parameters.AddWithValue("@RecentLearning", (object?)app.RecentLearning ?? DBNull.Value);
                        command.Parameters.AddWithValue("@WhyHireYou", (object?)app.WhyHireYou ?? DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { message = "Application submitted successfully" });
            }
            catch (Exception ex)
            {
                // In production, log the exception properly.
                return StatusCode(500, new { message = "An error occurred while submitting the application.", details = ex.Message });
            }
        }
    }
}
