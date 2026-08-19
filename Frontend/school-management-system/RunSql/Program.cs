using System;
using MySqlConnector;

namespace RunSql
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                using var conn = new MySqlConnection("Server=127.0.0.1;Port=3306;Database=SMS_NEW;User=root;Password=root;");
                conn.Open();

                Console.WriteLine("--- ADMINS IN DATABASE ---");
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT AdminId, Email, FullName, Role FROM admins;";
                    using var reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        Console.WriteLine($"AdminId: {reader[0]} | Email: {reader[1]} | Name: {reader[2]} | Role: {reader[3]}");
                    }
                }

                Console.WriteLine("\n--- USERS IN DATABASE ---");
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT UserId, Email, Role, IsActive FROM users;";
                    using var reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        Console.WriteLine($"UserId: {reader[0]} | Email: {reader[1]} | Role: {reader[2]} | IsActive: {reader[3]}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}
