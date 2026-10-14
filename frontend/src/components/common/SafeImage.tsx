import React, { useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  fallbackClassName?: string;
  showRetry?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  showRetry = true,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Reset error state whenever the image source changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const rawUrl = getImageUrl(src);
  // Append retryKey as query param only upon manual retry to force browser reload
  const resolvedUrl = retryKey > 0 && rawUrl ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}_retry=${retryKey}` : rawUrl;

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setRetryKey(prev => prev + 1);
  };

  if (!rawUrl || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-slate-400 bg-slate-900/60 border border-slate-700/50 rounded-xl text-center select-none ${fallbackClassName || className}`}
      >
        <ImageOff className="w-6 h-6 mb-1 text-slate-500 opacity-80" />
        <span className="text-[11px] font-semibold text-slate-400">Image unavailable</span>
        {showRetry && rawUrl && (
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-600 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <img
      {...props}
      key={retryKey}
      src={resolvedUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
