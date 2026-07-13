using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using JobAppBackend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Text.Json;

namespace JobAppBackend.Controllers
{
    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
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
                var applications = new List<ApplicationDto>();
                var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    string sql = @"
                        SELECT a.Id, a.Position, a.Name, a.Mobile, a.Email, a.Status, a.AdminNotes, a.SubmittedAt,
                               d.LocationData, d.ExperienceData, d.TextResponses
                        FROM Applications a
                        LEFT JOIN ApplicationDetails d ON a.Id = d.ApplicationId
                        ORDER BY a.SubmittedAt DESC";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var app = new ApplicationDto
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                    Position = reader.GetString(reader.GetOrdinal("Position")),
                                    Name = reader.GetString(reader.GetOrdinal("Name")),
                                    Mobile = reader.GetString(reader.GetOrdinal("Mobile")),
                                    Email = reader.GetString(reader.GetOrdinal("Email")),
                                    Status = reader.IsDBNull(reader.GetOrdinal("Status")) ? "Raw" : reader.GetString(reader.GetOrdinal("Status")),
                                    AdminNotes = reader.IsDBNull(reader.GetOrdinal("AdminNotes")) ? null : reader.GetString(reader.GetOrdinal("AdminNotes")),
                                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("SubmittedAt"))
                                };

                                if (!reader.IsDBNull(reader.GetOrdinal("LocationData")))
                                {
                                    var locData = JsonSerializer.Deserialize<ApplicationDto>(reader.GetString(reader.GetOrdinal("LocationData")), jsonOptions);
                                    if (locData != null)
                                    {
                                        app.FromState = locData.FromState;
                                        app.FromCity = locData.FromCity;
                                        app.BasedState = locData.BasedState;
                                        app.BasedCity = locData.BasedCity;
                                    }
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("ExperienceData")))
                                {
                                    var expData = JsonSerializer.Deserialize<ApplicationDto>(reader.GetString(reader.GetOrdinal("ExperienceData")), jsonOptions);
                                    if (expData != null)
                                    {
                                        app.WorkExperienceYears = expData.WorkExperienceYears;
                                        app.WorkExperienceMonths = expData.WorkExperienceMonths;
                                        app.IsCurrentlyEmployed = expData.IsCurrentlyEmployed;
                                        app.Employer = expData.Employer;
                                        app.Salary = expData.Salary;
                                        app.ExpectedSalary = expData.ExpectedSalary;
                                        app.JoiningDate = expData.JoiningDate;
                                    }
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("TextResponses")))
                                {
                                    var txtData = JsonSerializer.Deserialize<ApplicationDto>(reader.GetString(reader.GetOrdinal("TextResponses")), jsonOptions);
                                    if (txtData != null)
                                    {
                                        app.RecentLearning = txtData.RecentLearning;
                                        app.WhyHireYou = txtData.WhyHireYou;
                                    }
                                }

                                applications.Add(app);
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
                var adminIdClaim = User.Claims.FirstOrDefault(c => c.Type == "AdminId");
                if (adminIdClaim == null) return Unauthorized(new { message = "AdminId missing in token." });
                int adminId = int.Parse(adminIdClaim.Value);

                string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    string oldStatus = "";
                    string getSql = "SELECT Status, AdminNotes FROM Applications WHERE Id = @Id";
                    using (SqlCommand getCmd = new SqlCommand(getSql, connection))
                    {
                        getCmd.Parameters.AddWithValue("@Id", id);
                        var result = await getCmd.ExecuteScalarAsync();
                        if (result == null) return NotFound(new { message = "Application not found." });
                        oldStatus = result.ToString() ?? "";
                    }

                    // We removed the strict 'already up to date' block because notes could have changed even if status didn't.

                    using (SqlTransaction transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            string sql = "UPDATE Applications SET Status = @Status, AdminNotes = @AdminNotes WHERE Id = @Id";
                            using (SqlCommand command = new SqlCommand(sql, connection, transaction))
                            {
                                command.Parameters.AddWithValue("@Status", request.Status);
                                command.Parameters.AddWithValue("@AdminNotes", request.AdminNotes ?? (object)DBNull.Value);
                                command.Parameters.AddWithValue("@Id", id);
                                await command.ExecuteNonQueryAsync();
                            }

                            string logSql = "INSERT INTO ApplicationInteractions (ApplicationId, AdminId, OldStatus, NewStatus) VALUES (@AppId, @AdminId, @Old, @New)";
                            using (SqlCommand logCmd = new SqlCommand(logSql, connection, transaction))
                            {
                                logCmd.Parameters.AddWithValue("@AppId", id);
                                logCmd.Parameters.AddWithValue("@AdminId", adminId);
                                logCmd.Parameters.AddWithValue("@Old", oldStatus);
                                logCmd.Parameters.AddWithValue("@New", request.Status);
                                await logCmd.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                        }
                        catch
                        {
                            transaction.Rollback();
                            throw;
                        }
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
                    // ApplicationDetails has ON DELETE CASCADE, so deleting from Applications is sufficient
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
        public async Task<IActionResult> SubmitApplication([FromBody] ApplicationDto appDto)
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
                    
                    using (SqlTransaction transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // Insert into Applications table and get the new Id
                            string sqlApp = @"
                                INSERT INTO Applications (Position, Name, Mobile, Email, Status, SubmittedAt) 
                                OUTPUT INSERTED.Id
                                VALUES (@Position, @Name, @Mobile, @Email, 'Raw', GETDATE())";
                                
                            int applicationId;
                            using (SqlCommand cmdApp = new SqlCommand(sqlApp, connection, transaction))
                            {
                                cmdApp.Parameters.AddWithValue("@Position", appDto.Position);
                                cmdApp.Parameters.AddWithValue("@Name", appDto.Name);
                                cmdApp.Parameters.AddWithValue("@Mobile", appDto.Mobile);
                                cmdApp.Parameters.AddWithValue("@Email", appDto.Email);
                                applicationId = (int)await cmdApp.ExecuteScalarAsync();
                            }

                            // Serialize details to JSON
                            var locationData = JsonSerializer.Serialize(new { 
                                appDto.FromState, appDto.FromCity, appDto.BasedState, appDto.BasedCity 
                            });
                            
                            var experienceData = JsonSerializer.Serialize(new { 
                                appDto.WorkExperienceYears, appDto.WorkExperienceMonths, appDto.IsCurrentlyEmployed, 
                                appDto.Employer, appDto.Salary, appDto.ExpectedSalary, appDto.JoiningDate 
                            });
                            
                            var textResponses = JsonSerializer.Serialize(new { 
                                appDto.RecentLearning, appDto.WhyHireYou 
                            });

                            // Insert into ApplicationDetails
                            string sqlDetails = @"
                                INSERT INTO ApplicationDetails (ApplicationId, LocationData, ExperienceData, TextResponses)
                                VALUES (@ApplicationId, @LocationData, @ExperienceData, @TextResponses)";
                                
                            using (SqlCommand cmdDetails = new SqlCommand(sqlDetails, connection, transaction))
                            {
                                cmdDetails.Parameters.AddWithValue("@ApplicationId", applicationId);
                                cmdDetails.Parameters.AddWithValue("@LocationData", locationData);
                                cmdDetails.Parameters.AddWithValue("@ExperienceData", experienceData);
                                cmdDetails.Parameters.AddWithValue("@TextResponses", textResponses);
                                await cmdDetails.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                        }
                        catch
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }

                return Ok(new { message = "Application submitted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while submitting the application.", details = ex.Message });
            }
        }
    }
}
