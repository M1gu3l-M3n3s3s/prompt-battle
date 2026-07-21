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
  const generation = useRef(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback(() => {
    const gen = generation.current;

    if (retries.current >= 3) {
      if (generation.current !== gen) return;
      setState('error');
      return;
    }
    retries.current += 1;
    const img = new Image();
    imgRef.current = img;
    img.onload = () => {
      if (generation.current !== gen) return;
      setCurrentSrc(src);
      setState('loaded');
      imgRef.current = null;
    };
    img.onerror = () => {
      if (generation.current !== gen) return;
      imgRef.current = null;
      const delay = Math.min(2000 * retries.current, 15000);
      setTimeout(loadImage, delay);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    generation.current += 1;
    retries.current = 0;
    setState('loading');
    loadImage();
    return () => {
      generation.current++;
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
    </div>
  );
}
