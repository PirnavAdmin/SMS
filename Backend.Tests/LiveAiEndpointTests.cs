using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using Xunit;
using Xunit.Abstractions;

namespace Backend.Tests
{
    public class LiveAiEndpointTests
    {
        private readonly ITestOutputHelper _output;

        public LiveAiEndpointTests(ITestOutputHelper output)
        {
            _output = output;
        }

        private string GenerateToken(int userId, string role, string name, string email)
        {
            var keyBytes = Encoding.UTF8.GetBytes("SMS_Api_Secure_JWT_Signing_Key_2026_x9F8k2L7mQ1vN4pZ8sT3wE6yA0uC5iR!");
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.Email, email),
                new Claim("TenantId", "tenant-default"),
                new Claim("schoolId", "1")
            };

            var token = new JwtSecurityToken(
                issuer: "SMS_NEW_API",
                audience: "SMS_NEW_Client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [Fact]
        public void Test_CheckDatabaseCounts()
        {
            var dbs = new[] { "sms_new", "sms_new_test" };
            foreach (var db in dbs)
            {
                try
                {
                    using var conn = new MySqlConnector.MySqlConnection($"Server=127.0.0.1;Port=3306;Database={db};User=root;Password=root;");
                    conn.Open();
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT (SELECT COUNT(*) FROM students) AS sCount, (SELECT COUNT(*) FROM admission_applications) AS aCount";
                    using var reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        var sCount = reader.GetInt32(0);
                        var aCount = reader.GetInt32(1);
                        _output.WriteLine($"Database {db}: Students={sCount}, Admissions={aCount}, Total={sCount + aCount}");
                    }
                }
                catch (Exception ex)
                {
                    _output.WriteLine($"Database {db} error: {ex.Message}");
                }
            }
        }

        [Fact]
        public async Task Test_StudentEnrollmentQuery_LiveGeminiMultiTurn()
        {
            var token = GenerateToken(1, "Admin", "Admin", "admin@nextgen.com");
            using var client = new HttpClient();
            client.BaseAddress = new Uri("http://localhost:5151");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // 1. Initial Question: How many students are there in our school
            var payload1 = new
            {
                message = "How many students are there in our school",
                branchName = "Madhapur Branch",
                academicYear = "2026-27"
            };

            var jsonContent1 = new StringContent(JsonSerializer.Serialize(payload1), Encoding.UTF8, "application/json");
            var response1 = await client.PostAsync("/api/ai-assistant/chat", jsonContent1);
            var resStr1 = await response1.Content.ReadAsStringAsync();
            _output.WriteLine($"[Turn 1 Response]: {resStr1}");

            Assert.True(response1.IsSuccessStatusCode, $"Turn 1 failed: {resStr1}");
            Assert.Contains("student_get_overview", resStr1);

            using var doc1 = JsonDocument.Parse(resStr1);
            var data1 = doc1.RootElement.GetProperty("data");
            var convId = data1.GetProperty("conversationId").GetString();
            var reply1 = data1.GetProperty("reply").GetString();
            _output.WriteLine($"[Gemini Synthesized Reply 1]:\n{reply1}\n");

            // 2. Follow-Up Question: Which class has the highest enrollment?
            var payload2 = new
            {
                conversationId = convId,
                message = "Which class has the highest enrollment?",
                branchName = "Madhapur Branch",
                academicYear = "2026-27"
            };

            var jsonContent2 = new StringContent(JsonSerializer.Serialize(payload2), Encoding.UTF8, "application/json");
            var response2 = await client.PostAsync("/api/ai-assistant/chat", jsonContent2);
            var resStr2 = await response2.Content.ReadAsStringAsync();
            _output.WriteLine($"[Turn 2 Response]: {resStr2}");

            Assert.True(response2.IsSuccessStatusCode, $"Turn 2 failed: {resStr2}");
            using var doc2 = JsonDocument.Parse(resStr2);
            var reply2 = doc2.RootElement.GetProperty("data").GetProperty("reply").GetString();
            _output.WriteLine($"[Gemini Synthesized Follow-Up Reply 2]:\n{reply2}\n");
        }

        [Fact]
        public async Task Test_HostelOccupancyQuery_LiveGeminiMultiTurn()
        {
            var token = GenerateToken(1, "Admin", "Admin", "admin@nextgen.com");
            using var client = new HttpClient();
            client.BaseAddress = new Uri("http://localhost:5151");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var payload = new
            {
                message = "Are our hostel facilities fully occupied?",
                branchName = "Madhapur Branch",
                academicYear = "2026-27"
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("/api/ai-assistant/chat", jsonContent);

            var resStr = await response.Content.ReadAsStringAsync();
            _output.WriteLine($"Hostel Query Response: {resStr}");

            Assert.True(response.IsSuccessStatusCode);
            Assert.Contains("hostel_get_occupancy_overview", resStr);
        }

        [Fact]
        public async Task Test_FeeDefaultersQuery_LiveGeminiMultiTurn()
        {
            var token = GenerateToken(1, "Admin", "Admin", "admin@nextgen.com");
            using var client = new HttpClient();
            client.BaseAddress = new Uri("http://localhost:5151");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var payload = new
            {
                message = "Which students have pending or overdue fees?",
                branchName = "Madhapur Branch",
                academicYear = "2026-27"
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("/api/ai-assistant/chat", jsonContent);

            var resStr = await response.Content.ReadAsStringAsync();
            _output.WriteLine($"Fee Defaulters Response: {resStr}");

            Assert.True(response.IsSuccessStatusCode);
        }
    }
}
