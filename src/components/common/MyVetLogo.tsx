import React from 'react';

interface MyVetLogoProps {
  variant?: 'full' | 'compact' | 'header' | 'icon';
  className?: string;
  showSlogan?: boolean;
}

export const MyVetLogo: React.FC<MyVetLogoProps> = ({
  variant = 'compact',
  className = '',
  showSlogan = false
}) => {
  // Botanical Heart SVG Emblem with Dog, Cat silhouettes, Olive leaves, and Medical Cross
  const HeartEmblem = ({ size = 44 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer Heart outline */}
      <path
        d="M50 88C50 88 15 65 15 38C15 23 26 14 38 14C45 14 50 18 50 22C50 18 55 14 62 14C74 14 85 23 85 38C85 65 50 88 50 88Z"
        stroke="#5A7E32"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#F4F7EE"
      />

      {/* Medical Cross on upper right corner */}
      <rect x="74" y="10" width="7" height="20" rx="2" fill="#3A683D" />
      <rect x="67.5" y="16.5" width="20" height="7" rx="2" fill="#3A683D" />

      {/* Dog silhouette (darker forest green) */}
      <path
        d="M32 68C32 64 35 55 35 48C35 44 32 40 34 33C35 29 38 27 41 28C43 29 45 32 46 35C48 35 52 34 54 37C55 38 53 41 51 43C53 47 55 53 54 60C53 65 50 72 48 76C44 76 34 75 32 68Z"
        fill="#3A683D"
      />

      {/* Cat silhouette (leaf green) */}
      <path
        d="M48 76C48 71 50 63 53 58C55 54 58 52 60 48C61 46 63 46 64 47C65 49 63 51 64 53C66 53 68 56 67 59C66 63 65 67 66 73C65 76 60 77 56 77C52 77 49 77 48 76Z"
        fill="#5A7E32"
      />

      {/* Cat ear accents */}
      <polygon points="56,47 58,41 61,46" fill="#5A7E32" />
      <polygon points="62,46 64,42 66,48" fill="#5A7E32" />

      {/* Botanical Olive Branch leaves under heart */}
      <path
        d="M20 70C25 76 33 80 44 82"
        stroke="#859766"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="25" cy="71" rx="4" ry="2" transform="rotate(-30 25 71)" fill="#859766" />
      <ellipse cx="32" cy="76" rx="4" ry="2" transform="rotate(-15 32 76)" fill="#859766" />
      <ellipse cx="40" cy="80" rx="4" ry="2" transform="rotate(5 40 80)" fill="#859766" />
    </svg>
  );

  // Paw Print SVG
  const Paw = ({ size = 14, color = '#5A7E32' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className="inline-block shrink-0">
      <ellipse cx="8.5" cy="5.5" rx="2.5" ry="3.5" transform="rotate(-15 8.5 5.5)" />
      <ellipse cx="15.5" cy="5.5" rx="2.5" ry="3.5" transform="rotate(15 15.5 5.5)" />
      <ellipse cx="4" cy="11" rx="2.5" ry="3.5" transform="rotate(-30 4 11)" />
      <ellipse cx="20" cy="11" rx="2.5" ry="3.5" transform="rotate(30 20 11)" />
      <path d="M12 10.5C8 10.5 6 13.5 7 17.5C7.8 20.5 10 21.5 12 21.5C14 21.5 16.2 20.5 17 17.5C18 13.5 16 10.5 12 10.5Z" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <HeartEmblem size={38} />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="flex items-center gap-4">
          <HeartEmblem size={64} />
          <div className="flex flex-col items-start text-left">
            <div className="flex items-baseline gap-2">
              <span className="font-brand-script text-[42px] leading-none text-[#1B2F1C] tracking-wide select-none">
                My Vet
              </span>
              <Paw size={22} color="#5A7E32" />
            </div>
            <span className="text-[13px] font-extrabold tracking-[0.22em] text-[#1B2F1C] uppercase mt-0.5">
              CABINET VÉTÉRINAIRE
            </span>
          </div>
        </div>

        {showSlogan && (
          <div className="flex items-center gap-2 mt-2 text-[12px] text-[#52604C] font-medium tracking-wide">
            <Paw size={11} color="#859766" />
            <span>Le bien-être de vos compagnons, notre priorité</span>
            <Paw size={11} color="#859766" />
          </div>
        )}
      </div>
    );
  }

  // Header / compact default
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-11 h-11 rounded-xl bg-[#E7ECD9] flex items-center justify-center shrink-0 border border-[#C7D2BA] shadow-2xs">
        <HeartEmblem size={36} />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-brand-script text-[24px] font-bold text-[#1B2F1C] tracking-tight">
            My Vet
          </span>
          <Paw size={14} color="#5A7E32" />
        </div>
        <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#3A683D] uppercase leading-tight mt-0.5">
          CABINET VÉTÉRINAIRE
        </span>
        {showSlogan && (
          <span className="text-[9.5px] text-[#52604C] italic truncate mt-0.5">
            Le bien-être de vos compagnons
          </span>
        )}
      </div>
    </div>
  );
};
