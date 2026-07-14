import { useState, useCallback, useEffect, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageWithRetry({ src, alt, className }: Props) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState('');
  const retries = useRef(0);
  const mounted = useRef(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback(() => {
    if (retries.current >= 5) {
      if (!mounted.current) return;
      setState('error');
      return;
    }
    retries.current += 1;
    const img = new Image();
    imgRef.current = img;
    img.onload = () => {
      if (!mounted.current) return;
      setCurrentSrc(src);
      setState('loaded');
      imgRef.current = null;
    };
    img.onerror = () => {
      if (!mounted.current) return;
      imgRef.current = null;
      const delay = Math.min(2000 * retries.current, 15000);
      setTimeout(loadImage, delay);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    mounted.current = true;
    retries.current = 0;
    loadImage();
    return () => {
      mounted.current = false;
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
        imgRef.current = null;
      }
    };
  }, [loadImage]);

  if (state === 'loaded') {
    return <img src={currentSrc} alt={alt} className={className || 'w-full h-48 md:h-56 object-cover'} />;
  }

  if (state === 'error') {
    return (
      <div className={`bg-gray-800 flex flex-col items-center justify-center ${className || 'w-full h-48 md:h-56'}`}>
        <p className="text-gray-500 text-xs">Imagen no disponible</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 flex flex-col items-center justify-center animate-pulse ${className || 'w-full h-48 md:h-56'}`}>
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="text-gray-400 text-xs font-medium">Cargando imagen...</p>
      <p className="text-gray-600 text-[10px] mt-1">Intento #{retries.current}</p>
    </div>
  );
}
