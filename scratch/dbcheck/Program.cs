using System;
using MySqlConnector;

class Program
{
    static void Main()
    {
        string connStr = "Server=127.0.0.1;Port=3306;Database=SMS_NEW;User=root;Password=root;";
        using var conn = new MySqlConnection(connStr);
        conn.Open();
        
        using var cmd = new MySqlCommand("DESCRIBE classes;", conn);
        using var reader = cmd.ExecuteReader();
        Console.WriteLine("--- classes ---");
        while (reader.Read())
        {
            Console.WriteLine(reader.GetString(0));
        }

        reader.Close();
        cmd.CommandText = "DESCRIBE staff;";
        using var reader2 = cmd.ExecuteReader();
        Console.WriteLine("--- staff ---");
        while (reader2.Read())
        {
            Console.WriteLine(reader2.GetString(0));
        }
    }
}
