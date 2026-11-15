import { ColorTone, FrameStyle } from '../../types/eyewear';

interface FrameOverlaySvgProps {
  frameStyle: Exclude<FrameStyle, FrameStyle.ALL>;
  colorTone: Exclude<ColorTone, ColorTone.ALL>;
  className?: string;
}

function getStrokeColor(tone: Exclude<ColorTone, ColorTone.ALL>): string {
  switch (tone) {
    case ColorTone.GOLD:
      return '#B79248';
    case ColorTone.SILVER:
      return '#7B828A';
    case ColorTone.TORTOISE:
      return '#6D4322';
    case ColorTone.ROSE:
      return '#C98F8E';
    case ColorTone.CLEAR_CRYSTAL:
      return 'rgba(218, 224, 232, 0.9)';
    case ColorTone.BLACK:
    default:
      return '#1C1C1B';
  }
}

export function FrameOverlaySvg({ frameStyle, colorTone, className = '' }: FrameOverlaySvgProps) {
  const stroke = getStrokeColor(colorTone);
  const strokeWidth = frameStyle === FrameStyle.RIMLESS ? 1.8 : frameStyle === FrameStyle.AVIATOR ? 3.2 : 4.6;
  const lensFill =
    colorTone === ColorTone.CLEAR_CRYSTAL ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)';

  if (frameStyle === FrameStyle.ROUND) {
    return (
      <svg viewBox="0 0 320 110" className={className} fill="none" aria-hidden="true">
        <circle cx="88" cy="56" r="42" stroke={stroke} strokeWidth={strokeWidth} fill={lensFill} />
        <circle cx="232" cy="56" r="42" stroke={stroke} strokeWidth={strokeWidth} fill={lensFill} />
        <path d="M130 52 Q160 40 190 52" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="16" y1="50" x2="46" y2="52" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="274" y1="52" x2="304" y2="50" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }

  if (frameStyle === FrameStyle.CAT_EYE) {
    return (
      <svg viewBox="0 0 320 110" className={className} fill="none" aria-hidden="true">
        <path
          d="M34 36 C56 26, 114 34, 130 48 C134 74, 108 92, 76 90 C48 88, 36 62, 34 36 Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={lensFill}
        />
        <path
          d="M286 36 C264 26, 206 34, 190 48 C186 74, 212 92, 244 90 C272 88, 284 62, 286 36 Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={lensFill}
        />
        <path d="M130 48 Q160 39 190 48" stroke={stroke} strokeWidth={strokeWidth - 1} strokeLinecap="round" />
        <line x1="14" y1="38" x2="34" y2="38" stroke={stroke} strokeWidth={strokeWidth - 1} />
        <line x1="286" y1="38" x2="306" y2="38" stroke={stroke} strokeWidth={strokeWidth - 1} />
      </svg>
    );
  }

  if (frameStyle === FrameStyle.AVIATOR) {
    return (
      <svg viewBox="0 0 320 118" className={className} fill="none" aria-hidden="true">
        <line x1="88" y1="24" x2="232" y2="24" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" />
        <path
          d="M42 36 C78 28, 126 32, 138 46 C142 78, 112 102, 80 96 C48 90, 38 62, 42 36 Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={lensFill}
        />
        <path
          d="M278 36 C242 28, 194 32, 182 46 C178 78, 208 102, 240 96 C272 90, 282 62, 278 36 Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={lensFill}
        />
        <path d="M138 46 Q160 36 182 46" stroke={stroke} strokeWidth={2.6} />
      </svg>
    );
  }

  if (frameStyle === FrameStyle.BROWLINE) {
    return (
      <svg viewBox="0 0 320 110" className={className} fill="none" aria-hidden="true">
        <rect x="42" y="28" width="94" height="62" rx="18" stroke={stroke} strokeWidth={2.2} fill={lensFill} />
        <rect x="184" y="28" width="94" height="62" rx="18" stroke={stroke} strokeWidth={2.2} fill={lensFill} />
        <path d="M40 34 C68 22, 118 24, 138 36" stroke={stroke} strokeWidth={7.5} strokeLinecap="round" />
        <path d="M280 34 C252 22, 202 24, 182 36" stroke={stroke} strokeWidth={7.5} strokeLinecap="round" />
        <path d="M136 42 Q160 35 184 42" stroke={stroke} strokeWidth={3} />
      </svg>
    );
  }

  // SQUARE or RIMLESS
  return (
    <svg viewBox="0 0 320 110" className={className} fill="none" aria-hidden="true">
      <rect x="42" y="26" width="94" height="62" rx="14" stroke={stroke} strokeWidth={strokeWidth} fill={lensFill} />
      <rect x="184" y="26" width="94" height="62" rx="14" stroke={stroke} strokeWidth={strokeWidth} fill={lensFill} />
      <path d="M136 44 Q160 36 184 44" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="16" y1="40" x2="42" y2="42" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="278" y1="42" x2="304" y2="40" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
