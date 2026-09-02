import React from 'react';

interface OfficeCareLogoProps {
  /** Size of the logo icon in pixels (default: 32) */
  size?: number;
  /** Whether to show the text beside the icon (default: true) */
  showText?: boolean;
  /** Badge year or text (default: '') */
  badgeText?: string;
  /** Subtitle text (default: 'PHỤC HỒI CHỨC NĂNG') */
  subText?: string;
  /** Custom class for the wrapper */
  className?: string;
}

export const OfficeCareLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/logo.png?v=2"
        alt="OfficeCare Logo"
        className="w-full h-full object-contain select-none"
        loading="eager"
      />
    </div>
  );
};

export const OfficeCareLogo: React.FC<OfficeCareLogoProps> = ({
  size = 32,
  showText = true,
  badgeText = '',
  subText = 'PHỤC HỒI CHỨC NĂNG',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <OfficeCareLogoMark size={size} />

      {showText && (
        <div className="flex flex-col justify-center text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-heading font-black text-slate-900 dark:text-zinc-100 tracking-tight text-[15.5px] leading-tight">
              OFFICE CARE
            </span>
            {badgeText && (
              <span className="text-[8px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200/90 dark:border-teal-800 px-1 py-0.5 rounded leading-none">
                {badgeText}
              </span>
            )}
          </div>
          {subText && (
            <span className="text-[8.5px] font-black uppercase tracking-widest text-[#0D9488] dark:text-teal-400 mt-0.5 leading-tight">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficeCareLogo;
