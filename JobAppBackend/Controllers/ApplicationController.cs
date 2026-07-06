using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using JobAppBackend.Models;
using System.Threading.Tasks;

namespace JobAppBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ApplicationController(IConfiguration configuration)
        {
            _configuration = configuration;
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
