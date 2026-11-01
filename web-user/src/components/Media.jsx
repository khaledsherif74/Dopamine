import { assetUrl } from '@/config.js';

export function ProductImage({ src, alt = '', className = '' }) {
  const url = assetUrl(src);
  if (!url) {
    return (
      <div aria-hidden="true" className={`flex items-center justify-center bg-primary-tint text-primary ${className}`}>
        <svg width="40%" height="40%" viewBox="0 0 64 64" fill="currentColor"><path d="M14 36c0-9 8-16 18-16s18 7 18 16H14z" opacity=".9" /><rect x="10" y="38" width="44" height="8" rx="4" opacity=".6" /><rect x="16" y="48" width="32" height="6" rx="3" opacity=".4" /></svg>
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export function ShopAvatar({ name = '', size = 48 }) {
  const letter = name.trim().charAt(0).toUpperCase() || '•';
  return (
    <span aria-hidden="true" style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-text-inverse">
      {letter}
    </span>
  );
}
