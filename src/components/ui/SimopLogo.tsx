import React from 'react';

interface SimopLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'horizontal' | 'mark-only';
  showSubtitle?: boolean;
  textColor?: 'dark' | 'light';
}

export const SimopLogo: React.FC<SimopLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  textColor = 'dark',
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'mark-only') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src="/simop_logo.png"
          alt="SIMOP Logo"
          referrerPolicy="no-referrer"
          className={`${currentSize.img} object-contain`}
          onError={(e) => {
            // Fallback to local image path if needed
            (e.target as HTMLImageElement).src = '/src/assets/images/simop_logo_1790746636975.jpg';
          }}
        />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <img
          src="/simop_logo.png"
          alt="SIMOP Terpadu Logo"
          referrerPolicy="no-referrer"
          className={`${currentSize.img} object-contain mb-2 drop-shadow-sm`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/src/assets/images/simop_logo_1790746636975.jpg';
          }}
        />
        <div className="flex items-center tracking-tight leading-none">
          <span className={`font-black ${textColor === 'light' ? 'text-sky-400' : 'text-blue-600'} ${currentSize.text}`}>SIM</span>
          <span className={`font-black text-emerald-400 flex items-center ${currentSize.text}`}>
            O
            <span className="w-1.5 h-1.5 -ml-1.5 mb-1.5 inline-block bg-emerald-400 rounded-full" />
          </span>
          <span className={`font-black text-emerald-400 ${currentSize.text}`}>P</span>
        </div>
        <div className={`text-[10px] sm:text-xs font-extrabold tracking-[0.25em] uppercase mt-0.5 ${textColor === 'light' ? 'text-white' : 'text-blue-600'}`}>
          TERPADU
        </div>
        {showSubtitle && (
          <p className={`text-[10px] font-medium mt-1 ${textColor === 'light' ? 'text-slate-300' : 'text-slate-500'}`}>
            Sistem Informasi Operasional Petugas
          </p>
        )}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/simop_logo.png"
        alt="SIMOP Terpadu Logo"
        referrerPolicy="no-referrer"
        className={`${currentSize.img} object-contain shrink-0 drop-shadow-xs`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/src/assets/images/simop_logo_1790746636975.jpg';
        }}
      />
      <div className="leading-tight">
        <div className="flex items-center">
          <span className={`font-black tracking-tight ${textColor === 'light' ? 'text-sky-400' : 'text-blue-600'} ${currentSize.text}`}>SIM</span>
          <span className={`font-black tracking-tight text-emerald-400 ${currentSize.text}`}>OP</span>
          <span className={`ml-1.5 font-extrabold tracking-wider ${textColor === 'light' ? 'text-white' : 'text-blue-700'} ${currentSize.text}`}>
            TERPADU
          </span>
        </div>
        {showSubtitle && (
          <div className={`${currentSize.sub} font-semibold tracking-tight ${textColor === 'light' ? 'text-slate-300' : 'text-slate-500'}`}>
            Sistem Informasi Operasional Petugas
          </div>
        )}
      </div>
    </div>
  );
};
