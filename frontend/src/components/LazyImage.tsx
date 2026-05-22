import { useState, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  wrapperClassName = '', 
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset loaded state when src changes
    setIsLoaded(false);
    
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${wrapperClassName}`}>
      {/* Shimmer effect */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 animate-shimmer"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-all duration-700 ${
          isLoaded 
            ? 'opacity-100 blur-0 scale-100' 
            : 'opacity-0 blur-md scale-[1.02]'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
