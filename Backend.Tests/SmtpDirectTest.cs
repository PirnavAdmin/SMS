using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

namespace Backend.Tests
{
    public class SmtpDirectTest
    {
        private readonly ITestOutputHelper _output;

        public SmtpDirectTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task Test_Direct_Smtp_Exception()
        {
            try
            {
                using var client = new SmtpClient("smtp.gmail.com", 587)
                {
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential("pirnavsms@gmail.com", "rsrmigklndqmliti"),
                    EnableSsl = true
                };

                var msg = new MailMessage
                {
                    From = new MailAddress("pirnavsms@gmail.com", "Pirnav School"),
                    Subject = "Direct SMTP Diagnostic Test",
                    Body = "Test message body",
                    IsBodyHtml = false
                };
                msg.To.Add("pirnavsms@gmail.com");

                await client.SendMailAsync(msg);
                _output.WriteLine("SUCCESS: SmtpClient sent mail!");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"CAUGHT EXCEPTION: {ex.GetType().FullName}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    _output.WriteLine($"INNER EXCEPTION: {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}");
                }
                throw;
            }
        }
    }
}
