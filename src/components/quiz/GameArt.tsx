/** Vector art from the Figma game screens: score plate, star icon and card ornament. */

export function ScoreStar({ className }: { className?: string }) {
  return (
    <svg viewBox="5 4 48 48" className={className} fill="currentColor" aria-hidden>
      <path d="M22.5742 11.7368C25.5875 7.36952 27.0942 5.18588 29.2146 5.1797C31.335 5.17352 32.8544 7.34835 35.893 11.698L36.9796 13.2534C37.7816 14.4013 38.1826 14.9753 38.7393 15.3773C39.2959 15.7793 39.9669 15.9793 41.3088 16.3795L43.127 16.9217C48.2117 18.438 50.7541 19.1961 51.4152 21.2108C52.0763 23.2255 50.4775 25.3426 47.2797 29.5767L46.1362 31.0907C45.2923 32.2082 44.8703 32.7669 44.66 33.4205C44.4497 34.0742 44.4668 34.7742 44.5009 36.1741L44.5471 38.0708C44.6763 43.3752 44.7409 46.0274 43.0291 47.2788C41.3173 48.5301 38.8098 47.6637 33.7947 45.9308L32.0015 45.3112C30.6779 44.8539 30.0161 44.6252 29.3295 44.6272C28.6428 44.6292 27.9824 44.8617 26.6615 45.3267L24.8719 45.9568C19.8671 47.7189 17.3646 48.5999 15.6455 47.3585C13.9265 46.1172 13.9756 43.4646 14.0739 38.1596L14.1091 36.2626C14.135 34.8625 14.148 34.1625 13.9339 33.51C13.7198 32.8576 13.2946 32.3014 12.4442 31.1888L11.2919 29.6815C8.06953 25.4661 6.45834 23.3584 7.10771 21.3399C7.75708 19.3213 10.295 18.5484 15.3708 17.0025L17.1858 16.4498C18.5253 16.0418 19.1951 15.8378 19.7495 15.4326C20.3038 15.0274 20.7014 14.4511 21.4967 13.2985L22.5742 11.7368Z" />
    </svg>
  );
}

/** Golden plate with the question's points, sits on top of the question card. */
export function ScorePlate({ points, className }: { points: number; className?: string }) {
  return (
    <div className={className} style={{ width: 192, height: 118 }}>
      <svg viewBox="0 0 182.477 103.837" className="absolute inset-[10.83%_4.12%] h-auto w-[92%]" aria-hidden>
        <defs>
          <linearGradient id="sp0" x1="2.9" y1="19.6" x2="12.6" y2="18" gradientUnits="userSpaceOnUse"><stop stopColor="#FDC11D" /><stop offset="1" stopColor="#F19100" /></linearGradient>
          <linearGradient id="sp1" x1="94.5" y1="-12.7" x2="94.5" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF56B" /><stop offset="1" stopColor="#FFCB0E" /></linearGradient>
          <linearGradient id="sp2" x1="90.5" y1="1" x2="90.5" y2="76.9" gradientUnits="userSpaceOnUse"><stop stopColor="#FFC61A" /><stop offset="1" stopColor="#FFB115" /></linearGradient>
          <filter id="spd" x="0" y="0" width="182.5" height="103.8" filterUnits="userSpaceOnUse"><feDropShadow dy="1.96" stdDeviation="2.94" floodColor="#6C84CC" floodOpacity="0.22" /></filter>
        </defs>
        <path d="M0.43442 10.7756C0.43442 6.98848 3.53612 3.91843 7.36226 3.91843H13.3003V17.6327H0.43442V10.7756Z" fill="url(#sp0)" />
        <path filter="url(#spd)" d="M5.87757 3.91838H171.651C174.384 3.91838 176.599 6.11127 176.599 8.81634V70.5306C176.599 84.597 165.079 96 150.867 96H38.0425C23.8312 96 12.3106 84.597 12.3106 70.5306V10.2857C12.3106 6.76914 9.43042 3.91838 5.87757 3.91838Z" fill="url(#sp1)" />
        <path d="M14.29 3.91838H161.754C164.487 3.91838 166.702 6.11127 166.702 8.81634V69.551C166.702 78.2073 159.613 85.2245 150.867 85.2245H38.0426C29.2971 85.2245 22.2075 78.2073 22.2075 69.551V8.81634C22.2075 6.11128 19.992 3.91838 17.2591 3.91838H14.29Z" fill="url(#sp2)" />
      </svg>
      <ScoreStar className="absolute left-[23.5%] top-[22.7%] h-[49.8%] w-[30.5%] text-card" />
      <span className="absolute inset-[25.33%_15.81%_27.88%_47.59%] flex items-center justify-center font-display text-[43px] font-semibold leading-none text-card">
        {points}
      </span>
    </div>
  );
}

/** Thin four-pointed star drawn across an unopened game card. */
export function CardOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 450 422.5" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M52.2137 212C150.5 212 224 275.863 224 383.786V422.5H226V383.786C226 275.569 299.5 212 397.786 212H450V210H397.786C289.422 210 226 136 226 38.2137V0H224V38.2137C224 137 160.137 210 52.2137 210H0V212H52.2137Z"
        className="fill-game-card-line"
      />
    </svg>
  );
}
