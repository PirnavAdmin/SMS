using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace SMS.Api.Common
{
    public class FlexibleBoolModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            if (bindingContext == null)
            {
                throw new ArgumentNullException(nameof(bindingContext));
            }

            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
            if (valueProviderResult == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueProviderResult);
            var value = valueProviderResult.FirstValue;

            if (string.IsNullOrWhiteSpace(value) || string.Equals(value, "all", StringComparison.OrdinalIgnoreCase))
            {
                bindingContext.Result = ModelBindingResult.Success(null);
                return Task.CompletedTask;
            }

            if (string.Equals(value, "active", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) ||
                value == "1")
            {
                bindingContext.Result = ModelBindingResult.Success(true);
                return Task.CompletedTask;
            }

            if (string.Equals(value, "inactive", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "false", StringComparison.OrdinalIgnoreCase) ||
                value == "0")
            {
                bindingContext.Result = ModelBindingResult.Success(false);
                return Task.CompletedTask;
            }

            if (bool.TryParse(value, out bool parsed))
            {
                bindingContext.Result = ModelBindingResult.Success(parsed);
                return Task.CompletedTask;
            }

            // Treat unrecognized strings gracefully as null (all) instead of failing validation
            bindingContext.Result = ModelBindingResult.Success(null);
            return Task.CompletedTask;
        }
    }
}
