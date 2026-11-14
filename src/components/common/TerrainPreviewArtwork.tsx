import React from 'react';

interface TerrainPreviewArtworkProps {
  siteId: string;
  siteName: string;
  badgeText?: string;
  scoreText?: string;
  heightClass?: string;
}

/**
 * Procedural SVG geological landscape thumbnails representing each analog biome
 * (High Puna salar, Antarctic dry valley, Tibetan yardang basin, Arctic polar desert).
 */
export const TerrainPreviewArtwork: React.FC<TerrainPreviewArtworkProps> = ({
  siteId,
  siteName,
  badgeText,
  scoreText,
  heightClass = 'h-28',
}) => {
  const palette = React.useMemo(() => {
    if (siteId.includes('univ') || siteId.includes('devon') || siteId.includes('haughton') || siteId.includes('svalbard')) {
      return {
        skyTop: '#C9D9E4',
        skyBottom: '#ECEAE3',
        sunColor: '#FFF7E4',
        farRidge: '#6E7F8C',
        midRidge: '#46545F',
        nearSlope: '#2F3941',
        basinFloor: '#D8DFE3',
        accentLine: '#9BB4C7',
      };
    }
    if (siteId.includes('qaidam') || siteId.includes('tabernas') || siteId.includes('dakhla') || siteId.includes('utah')) {
      return {
        skyTop: '#E5CEB8',
        skyBottom: '#F6E7D7',
        sunColor: '#FFF3DF',
        farRidge: '#A96B4A',
        midRidge: '#8A4E31',
        nearSlope: '#63341E',
        basinFloor: '#D8B18E',
        accentLine: '#E08B5E',
      };
    }
    // Puna salar / Atacama / Salar de Gorbea
    return {
      skyTop: '#D4CFC7',
      skyBottom: '#F5ECE1',
      sunColor: '#FFF6E8',
      farRidge: '#7B6959',
      midRidge: '#5A4A3C',
      nearSlope: '#3E332B',
      basinFloor: '#E5DDD0',
      accentLine: '#C69D73',
    };
  }, [siteId]);

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#414943]/10 bg-[#F3EDE5]`}
      aria-label={`${siteName} terrain profile`}
    >
      <svg
        viewBox="0 0 360 120"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id={`sky-${siteId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.skyTop} />
            <stop offset="100%" stopColor={palette.skyBottom} />
          </linearGradient>
        </defs>
        <rect width="360" height="120" fill={`url(#sky-${siteId})`} />
        <circle cx="292" cy="26" r="14" fill={palette.sunColor} opacity="0.9" />

        {/* Far geological ridge */}
        <path
          d="M0,74 L38,54 L88,63 L145,42 L205,58 L268,46 L320,60 L360,50 L360,120 L0,120 Z"
          fill={palette.farRidge}
        />
        {/* Mid eroded strata / yardang or nunatak ridge */}
        <path
          d="M0,86 L54,68 L112,78 L168,61 L234,76 L296,65 L360,79 L360,120 L0,120 Z"
          fill={palette.midRidge}
        />
        {/* Foreground escarpment & evaporite / regolith basin */}
        <path
          d="M0,98 Q85,84 172,94 T360,92 L360,120 L0,120 Z"
          fill={palette.basinFloor}
        />
        <path
          d="M0,104 L65,91 L126,108 L0,120 Z"
          fill={palette.nearSlope}
        />
        <path
          d="M90,103 Q180,96 290,105"
          fill="none"
          stroke={palette.accentLine}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.7"
        />
      </svg>

      {badgeText && (
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#1D1B17]/80 text-[#FFFFFF] text-[10px] font-medium tracking-wide">
          {badgeText}
        </span>
      )}
      {scoreText && (
        <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#0F422E] text-[#FFFFFF] font-mono text-[11px] font-semibold">
          {scoreText}
        </span>
      )}
    </div>
  );
};
