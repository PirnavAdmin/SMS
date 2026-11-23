using System;
using System.ComponentModel;
using System.Globalization;

namespace SMS.Api.Common
{
    public class FlexibleBoolTypeConverter : TypeConverter
    {
        public override bool CanConvertFrom(ITypeDescriptorContext? context, Type sourceType)
        {
            if (sourceType == typeof(string))
            {
                return true;
            }
            return base.CanConvertFrom(context, sourceType);
        }

        public override object? ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value)
        {
            if (value is string str)
            {
                if (string.IsNullOrWhiteSpace(str) || string.Equals(str, "all", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (string.Equals(str, "active", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(str, "true", StringComparison.OrdinalIgnoreCase) ||
                    str == "1")
                {
                    return true;
                }

                if (string.Equals(str, "inactive", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(str, "false", StringComparison.OrdinalIgnoreCase) ||
                    str == "0")
                {
                    return false;
                }

                if (bool.TryParse(str, out bool parsed))
                {
                    return parsed;
                }

                return null;
            }

            return base.ConvertFrom(context, culture, value);
        }
    }
}
