using System.Text.Json;
using System.Globalization;
using SMS.Api.Common;

namespace Backend.Tests.Common;

public class FlexibleJsonConverterTests
{
    [Theory]
    [InlineData("42", 42)]
    [InlineData("\"42\"", 42)]
    [InlineData("\"Class 10\"", 10)]
    [InlineData("\"\"", 0)]
    [InlineData("\"not a number\"", 0)]
    public void FlexibleIntConverter_ReadsSupportedAndFallbackValues(string json, int expected)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleIntConverter());

        Assert.Equal(expected, JsonSerializer.Deserialize<int>(json, options));
    }

    [Theory]
    [InlineData("9223372036854775807", 9223372036854775807L)]
    [InlineData("\"12345\"", 12345L)]
    [InlineData("\"Route 12345\"", 12345L)]
    [InlineData("\"\"", 0L)]
    [InlineData("\"not a number\"", 0L)]
    public void FlexibleLongConverter_ReadsSupportedAndFallbackValues(string json, long expected)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleLongConverter());

        Assert.Equal(expected, JsonSerializer.Deserialize<long>(json, options));
    }

    [Theory]
    [InlineData("42", "42")]
    [InlineData("\"42\"", "42")]
    [InlineData("\"not a number\"", "0")]
    public void FlexibleDecimalConverter_ReadsSupportedAndFallbackValues(string json, string expected)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleDecimalConverter());

        Assert.Equal(
            decimal.Parse(expected, CultureInfo.InvariantCulture),
            JsonSerializer.Deserialize<decimal>(json, options));
    }

    [Theory]
    [InlineData("null")]
    [InlineData("\"\"")]
    [InlineData("\"not a number\"")]
    public void FlexibleNullableLongConverter_ReturnsNullForEmptyOrInvalidValues(string json)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleNullableLongConverter());

        Assert.Null(JsonSerializer.Deserialize<long?>(json, options));
    }

    [Theory]
    [InlineData("true", true)]
    [InlineData("false", false)]
    [InlineData("\"Active\"", true)]
    [InlineData("\"active\"", true)]
    [InlineData("\"true\"", true)]
    [InlineData("\"1\"", true)]
    [InlineData("\"inactive\"", false)]
    [InlineData("1", true)]
    [InlineData("0", false)]
    [InlineData("-1", true)]
    public void FlexibleBoolConverter_ReadsSupportedValues(string json, bool expected)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleBoolConverter());

        Assert.Equal(expected, JsonSerializer.Deserialize<bool>(json, options));
    }

    [Theory]
    [InlineData("null")]
    [InlineData("\"\"")]
    [InlineData("\"string\"")]
    [InlineData("\"null\"")]
    [InlineData("\"not a date\"")]
    public void FlexibleNullableDateTimeConverter_ReturnsNullForEmptyOrInvalidValues(string json)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleNullableDateTimeConverter());

        Assert.Null(JsonSerializer.Deserialize<DateTime?>(json, options));
    }

    [Fact]
    public void FlexibleNullableDateTimeConverter_ReadsUnixSecondsAsUtc()
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleNullableDateTimeConverter());

        Assert.Equal(
            DateTime.UnixEpoch,
            JsonSerializer.Deserialize<DateTime?>("0", options));
    }

    [Theory]
    [InlineData("-62135596800", "0001-01-01T00:00:00Z")]
    [InlineData("253402300799", "9999-12-31T23:59:59Z")]
    public void FlexibleNullableDateTimeConverter_ReadsUnixSecondRangeBoundaries(
        string json,
        string expected)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleNullableDateTimeConverter());

        Assert.Equal(
            DateTime.Parse(expected, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
            JsonSerializer.Deserialize<DateTime?>(json, options));
    }

    [Theory]
    [InlineData("-9223372036854775808")]
    [InlineData("9223372036854775807")]
    public void FlexibleNullableDateTimeConverter_ReturnsNullForOutOfRangeUnixSeconds(string json)
    {
        var options = new JsonSerializerOptions();
        options.Converters.Add(new FlexibleNullableDateTimeConverter());

        Assert.Null(JsonSerializer.Deserialize<DateTime?>(json, options));
    }
}
