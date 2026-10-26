namespace SMS.Api.Helpers;

using System;
using System.Security.Cryptography;
using System.Text;

public static class PasswordHelper
{
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string Lower = "abcdefghijkmnopqrstuvwxyz";
    private const string Digits = "23456789";
    private const string Special = "!@#$%^&*";

    /// <summary>
    /// Generates a cryptographically secure, random, dynamic password
    /// meeting complexity requirements (uppercase, lowercase, digits, special characters).
    /// </summary>
    public static string GenerateDynamicPassword(int length = 12)
    {
        if (length < 8) length = 8;

        var bytes = new byte[length];
        RandomNumberGenerator.Fill(bytes);

        var sb = new StringBuilder();
        // Ensure at least one character from each set
        sb.Append(Upper[bytes[0] % Upper.Length]);
        sb.Append(Lower[bytes[1] % Lower.Length]);
        sb.Append(Digits[bytes[2] % Digits.Length]);
        sb.Append(Special[bytes[3] % Special.Length]);

        var allChars = Upper + Lower + Digits + Special;
        for (int i = 4; i < length; i++)
        {
            sb.Append(allChars[bytes[i] % allChars.Length]);
        }

        // Shuffle characters securely
        var array = sb.ToString().ToCharArray();
        for (int i = array.Length - 1; i > 0; i--)
        {
            int j = bytes[i % bytes.Length] % (i + 1);
            (array[i], array[j]) = (array[j], array[i]);
        }

        return new string(array);
    }

    /// <summary>
    /// Generates a cryptographically secure random numeric OTP string.
    /// </summary>
    public static string GenerateNumericOtp(int length = 6)
    {
        if (length < 4) length = 4;
        var bytes = new byte[length];
        RandomNumberGenerator.Fill(bytes);

        var sb = new StringBuilder(length);
        for (int i = 0; i < length; i++)
        {
            sb.Append(Digits[bytes[i] % Digits.Length]);
        }
        return sb.ToString();
    }
}
