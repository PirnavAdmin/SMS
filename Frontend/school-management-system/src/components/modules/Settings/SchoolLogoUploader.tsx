import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Link as LinkIcon, AlertCircle, 
  CheckCircle2, AlertTriangle, Trash2, RefreshCw, Eye, 
  FileImage, Info, Sparkles, Sun, Moon, Check, X
} from 'lucide-react';

interface SchoolLogoUploaderProps {
  value: string;
  onChange: (newLogoUrl: string) => void;
  defaultLogo?: string;
}

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  sizeBytes?: number;
  format?: string;
  fileName?: string;
}

interface ValidationState {
  isValid: boolean;
  formatValid: boolean;
  sizeValid: boolean;
  dimensionQuality: 'excellent' | 'good' | 'low-res' | 'oversized' | 'unknown';
  errorMessage?: string;
  warnings: string[];
}

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_FALLBACK_LOGO = '/pirnav-school-logo.png';

export const SchoolLogoUploader: React.FC<SchoolLogoUploaderProps> = ({
  value,
  onChange,
  defaultLogo = DEFAULT_FALLBACK_LOGO
}) => {
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'header'>('light');
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: true,
    formatValid: true,
    sizeValid: true,
    dimensionQuality: 'good',
    warnings: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format bytes
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to determine aspect ratio description
  const getAspectRatioLabel = (w: number, h: number): string => {
    if (!w || !h) return 'N/A';
    const ratio = w / h;
    if (Math.abs(ratio - 1) < 0.08) return '1:1 Square (Ideal for Crest/Icon)';
    if (Math.abs(ratio - 1.33) < 0.1) return '4:3 Standard';
    if (Math.abs(ratio - 1.77) < 0.15) return '16:9 Wide';
    if (ratio >= 2 && ratio <= 4) return `${ratio.toFixed(1)}:1 Landscape (Ideal for Header Banner)`;
    if (ratio > 4) return 'Ultra Wide Banner';
    if (ratio < 0.8) return 'Portrait Badge';
    return `${ratio.toFixed(2)}:1`;
  };

  // Analyze loaded image element for dimensions and validation
  const analyzeImage = useCallback((imgSrc: string, fileInfo?: { size?: number; format?: string; name?: string }) => {
    if (!imgSrc) {
      setMeta(null);
      setValidation({
        isValid: false,
        formatValid: false,
        sizeValid: true,
        dimensionQuality: 'unknown',
        errorMessage: 'No logo image selected',
        warnings: []
      });
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const aspectRatio = getAspectRatioLabel(width, height);

      // Detect format if not provided
      let detectedFormat = fileInfo?.format;
      if (!detectedFormat) {
        if (imgSrc.startsWith('data:image/png')) detectedFormat = 'PNG';
        else if (imgSrc.startsWith('data:image/jpeg') || imgSrc.startsWith('data:image/jpg')) detectedFormat = 'JPEG';
        else if (imgSrc.startsWith('data:image/webp')) detectedFormat = 'WEBP';
        else if (imgSrc.startsWith('data:image/svg+xml')) detectedFormat = 'SVG';
        else {
          const match = imgSrc.split('?')[0].match(/\.(png|jpg|jpeg|webp|svg)$/i);
          detectedFormat = match ? match[1].toUpperCase() : 'IMAGE';
        }
      }

      setMeta({
        width,
        height,
        aspectRatio,
        sizeBytes: fileInfo?.size,
        format: detectedFormat,
        fileName: fileInfo?.name
      });

      // Validations & Quality Guidance
      const warnings: string[] = [];
      let dimensionQuality: ValidationState['dimensionQuality'] = 'good';

      if (width < 80 || height < 80) {
        dimensionQuality = 'low-res';
        warnings.push(`Low resolution (${width}×${height}px). Recommend at least 150×150px for sharp printing and retina displays.`);
      } else if (width >= 200 && height >= 200 && width <= 1600 && height <= 1600) {
        dimensionQuality = 'excellent';
      } else if (width > 2400 || height > 2400) {
        dimensionQuality = 'oversized';
        warnings.push(`Large dimensions (${width}×${height}px). It will be scaled down for display.`);
      }

      const sizeValid = !fileInfo?.size || fileInfo.size <= MAX_FILE_SIZE_BYTES;
      if (!sizeValid) {
        warnings.push(`File size (${formatFileSize(fileInfo?.size)}) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`);
      }

      setValidation({
        isValid: sizeValid,
        formatValid: true,
        sizeValid,
        dimensionQuality,
        warnings
      });
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
      setMeta(null);
      setValidation({
        isValid: false,
        formatValid: false,
        sizeValid: true,
        dimensionQuality: 'unknown',
        errorMessage: 'Unable to load image. Please verify file format or check the URL.',
        warnings: []
      });
    };

    img.src = imgSrc;
  }, []);

  // Update whenever initial or external value changes
  useEffect(() => {
    if (value) {
      analyzeImage(value);
    }
  }, [value, analyzeImage]);

  // Handle local file selection
  const processSelectedFile = (file: File) => {
    // 1. Format validation
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type);
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isMimeAllowed && !isExtAllowed) {
      setValidation({
        isValid: false,
        formatValid: false,
        sizeValid: true,
        dimensionQuality: 'unknown',
        errorMessage: `Unsupported file format (.${fileExt}). Please upload PNG, JPEG, WebP, or SVG.`,
        warnings: []
      });
      return;
    }

    // 2. Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidation({
        isValid: false,
        formatValid: true,
        sizeValid: false,
        dimensionQuality: 'unknown',
        errorMessage: `File size (${formatFileSize(file.size)}) exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
        warnings: []
      });
      return;
    }

    // 3. Read file as Data URL
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl);
        analyzeImage(dataUrl, {
          size: file.size,
          format: fileExt.toUpperCase(),
          name: file.name
        });
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setValidation({
        isValid: false,
        formatValid: false,
        sizeValid: true,
        dimensionQuality: 'unknown',
        errorMessage: 'Failed to read file from disk.',
        warnings: []
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    analyzeImage(urlInput.trim());
  };

  const handleResetDefault = () => {
    onChange(defaultLogo);
    setUrlInput(defaultLogo);
    analyzeImage(defaultLogo);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setMeta(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            School Brand Logo
          </label>
          {/* <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Upload school crest or header banner (PNG, JPEG, WebP, SVG). Real-time pixel and quality check.
          </p> */}
        </div>

        <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSourceMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sourceMode === 'upload'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sourceMode === 'url'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Image URL
          </button>
        </div>
      </div>

      {/* Input Area: Upload Drag & Drop vs URL */}
      {sourceMode === 'upload' ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag & drop school logo
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Supported formats: <strong className="text-slate-700 dark:text-slate-300">PNG, JPG, JPEG, WEBP, SVG</strong> (Max {MAX_FILE_SIZE_MB}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://example.com/school-logo.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Paste a public direct link to an image file (PNG, JPG, SVG, WebP).
          </p>
        </div>
      )}

      {/* Real-time Validation Error Banner */}
      {validation.errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <p className="font-bold">Validation Error</p>
            <p className="text-[11px] mt-0.5">{validation.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Real-Time Warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-1.5">
          {validation.warnings.map((warn, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] leading-tight">{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active Logo Details, Real-time Pixels & Live Preview */}
      {value && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Live Image Inspector & Real-time Dimensions
              </span>
            </div>

            {/* Preview Canvas Mode Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
              <button
                type="button"
                title="Light Background Canvas"
                onClick={() => setPreviewTheme('light')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                  previewTheme === 'light'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" /> Light
              </button>
              <button
                type="button"
                title="Dark Background Canvas"
                onClick={() => setPreviewTheme('dark')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                  previewTheme === 'dark'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" /> Dark
              </button>
              <button
                type="button"
                title="Header Bar Simulation"
                onClick={() => setPreviewTheme('header')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                  previewTheme === 'header'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Header Mock
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div
            className={`relative rounded-xl p-4 flex items-center justify-center min-h-[140px] border transition-colors ${
              previewTheme === 'light'
                ? 'bg-white border-slate-200'
                : previewTheme === 'dark'
                ? 'bg-slate-950 border-slate-800'
                : 'bg-brand-900 border-brand-800'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing image pixels...
              </div>
            ) : previewTheme === 'header' ? (
              <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-white/20">
                <img
                  src={value}
                  alt="School Logo"
                  className="max-h-10 max-w-[140px] object-contain"
                />
                <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  <div className="text-xs font-black italic tracking-wider text-sky-700 dark:text-sky-400">
                    PIRNAV
                  </div>
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    School Header Preview
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={value}
                alt="School Logo Preview"
                className="max-h-28 max-w-full object-contain filter drop-shadow-sm transition-all"
              />
            )}
          </div>

          {/* Real-time Pixel & Format Inspection Grid */}
          {meta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pixel Resolution
                </p>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                  {meta.width} × {meta.height} px
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Image Format
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    {meta.format || 'IMAGE'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Aspect Ratio
                </p>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={meta.aspectRatio}>
                  {meta.aspectRatio}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  File Size
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatFileSize(meta.sizeBytes)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons: Replace / Reset / Remove */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-brand-600" /> Change Image
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Reset Default
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Logo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
