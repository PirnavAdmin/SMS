namespace SMS.Api.Controllers
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using System;
    using System.IO;

    [ApiController]
    [AllowAnonymous]
    [Route("uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly string _wwwrootPath;
        private readonly string _contentRootUploadsPath;

        public UploadsController()
        {
            var contentRoot = Directory.GetCurrentDirectory();
            _wwwrootPath = Path.Combine(contentRoot, "wwwroot", "uploads");
            _contentRootUploadsPath = Path.Combine(contentRoot, "uploads");
        }

        [HttpGet("{*subpath}")]
        [AllowAnonymous]
        public IActionResult GetUploadFile(string subpath)
        {
            if (string.IsNullOrWhiteSpace(subpath))
            {
                return NotFound();
            }

            var cleanPath = subpath.Replace('/', Path.DirectorySeparatorChar).TrimStart('\\', '/');

            // 1. Check in wwwroot/uploads
            var fileInWwwroot = Path.Combine(_wwwrootPath, cleanPath);
            if (System.IO.File.Exists(fileInWwwroot))
            {
                var contentType = GetContentType(fileInWwwroot);
                return PhysicalFile(fileInWwwroot, contentType);
            }

            // 2. Check in content root /uploads
            var fileInContentRoot = Path.Combine(_contentRootUploadsPath, cleanPath);
            if (System.IO.File.Exists(fileInContentRoot))
            {
                var contentType = GetContentType(fileInContentRoot);
                return PhysicalFile(fileInContentRoot, contentType);
            }

            // 3. Check in Frontend public /uploads
            try
            {
                var frontendPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "school-management-system", "public", "uploads", cleanPath));
                if (System.IO.File.Exists(frontendPath))
                {
                    var contentType = GetContentType(frontendPath);
                    return PhysicalFile(frontendPath, contentType);
                }
            }
            catch { }

            // 4. Fallback for missing avatar/image uploads to prevent 404 console errors
            var lowerPath = subpath.ToLowerInvariant();
            if (lowerPath.Contains("profile") || lowerPath.Contains("avatar") || lowerPath.EndsWith(".jpg") || lowerPath.EndsWith(".png") || lowerPath.EndsWith(".jpeg") || lowerPath.EndsWith(".webp") || lowerPath.EndsWith(".svg"))
            {
                string fallbackSvg = @"<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
                    <rect width='128' height='128' rx='64' fill='#e2e8f0'/>
                    <circle cx='64' cy='48' r='24' fill='#94a3b8'/>
                    <path d='M24 108c0-22.091 17.909-40 40-40s40 17.909 40 40' fill='#94a3b8'/>
                </svg>";
                return Content(fallbackSvg, "image/svg+xml");
            }

            return NotFound();
        }

        private static string GetContentType(string filePath)
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream",
            };
        }
    }
}
