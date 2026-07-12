import React from 'react';

interface EnemySpriteProps {
  enemy: {
    type: string;
    isBoss?: boolean;
    name?: string;
    animalType?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    accessories?: string[];
  };
  isAttacking?: boolean;
}

export const EnemySprite: React.FC<EnemySpriteProps> = ({ enemy, isAttacking }) => {
  const animClass = isAttacking ? 'animate-[bounce_0.2s_ease-in-out_infinite]' : '';

  // Fallbacks for color
  const primary = enemy.primaryColor || '#A0522D';
  const secondary = enemy.secondaryColor || '#F5DEB3';
  const accent = enemy.accentColor || '#FF69B4';
  const animal = enemy.animalType || 'bear';
  const accList = enemy.accessories || [];

  return (
    <div className={`relative flex items-center justify-center select-none ${animClass}`}>
      <svg width={enemy.isBoss ? "90" : "60"} height={enemy.isBoss ? "90" : "60"} viewBox="0 0 100 100" className="overflow-visible">
        {/* Background Cape Accessory */}
        {accList.includes('cape') && (
          <path d="M 25 70 L 5 100 L 95 100 L 75 70 Z" fill="#DC2626" opacity="0.9" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
        )}

        {/* Wings Accessory */}
        {accList.includes('wings') && (
          <g>
            {/* Left Wing */}
            <path d="M 20 50 Q -15 20 0 10 Q 15 10 15 45" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
            <path d="M 20 50 Q -25 35 -10 25 Q 5 25 10 45" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1" />
            {/* Right Wing */}
            <path d="M 80 50 Q 115 20 100 10 Q 85 10 85 45" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
            <path d="M 80 50 Q 125 35 110 25 Q 95 25 90 45" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1" />
          </g>
        )}

        {/* Horns Accessory */}
        {accList.includes('horns') && (
          <g>
            <path d="M 25 25 Q 10 10 15 0 Q 22 10 32 20 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <path d="M 75 25 Q 90 10 85 0 Q 78 10 68 20 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
          </g>
        )}

        {/* Animal-Specific rendering */}
        {animal === 'bear' && (
          <g>
            {/* Ears */}
            <circle cx="20" cy="25" r="13" fill={primary} />
            <circle cx="20" cy="25" r="7" fill={secondary} />
            <circle cx="80" cy="25" r="13" fill={primary} />
            <circle cx="80" cy="25" r="7" fill={secondary} />
            {/* Head */}
            <circle cx="50" cy="55" r="35" fill={primary} />
            {/* Muzzle */}
            <ellipse cx="50" cy="67" rx="16" ry="12" fill={secondary} />
            {/* Nose */}
            <ellipse cx="50" cy="62" rx="7" ry="4" fill="#111" />
          </g>
        )}

        {animal === 'cat' && (
          <g>
            {/* Ears */}
            <polygon points="12,15 40,40 15,50" fill={primary} />
            <polygon points="18,22 36,38 20,44" fill={secondary} />
            <polygon points="88,15 60,40 85,50" fill={primary} />
            <polygon points="82,22 64,38 80,44" fill={secondary} />
            {/* Head */}
            <ellipse cx="50" cy="55" rx="36" ry="32" fill={primary} />
            {/* Whiskers */}
            <line x1="8" y1="58" x2="28" y2="60" stroke="#111" strokeWidth="1.5" />
            <line x1="8" y1="68" x2="28" y2="66" stroke="#111" strokeWidth="1.5" />
            <line x1="92" y1="58" x2="72" y2="60" stroke="#111" strokeWidth="1.5" />
            <line x1="92" y1="68" x2="72" y2="66" stroke="#111" strokeWidth="1.5" />
            {/* Snout */}
            <circle cx="44" cy="65" r="6" fill={secondary} />
            <circle cx="56" cy="65" r="6" fill={secondary} />
            <polygon points="46,60 54,60 50,65" fill="#FFB6C1" />
          </g>
        )}

        {animal === 'fox' && (
          <g>
            {/* Large pointed ears */}
            <polygon points="10,10 38,40 10,48" fill={primary} />
            <polygon points="18,18 34,38 18,44" fill={secondary} />
            <polygon points="90,10 62,40 90,48" fill={primary} />
            <polygon points="82,18 66,38 82,44" fill={secondary} />
            {/* Head */}
            <ellipse cx="50" cy="55" rx="36" ry="30" fill={primary} />
            {/* White/secondary color cheeks */}
            <path d="M 14 55 Q 30 75 50 68 Q 70 75 86 55 Q 92 70 80 80 Q 50 90 20 80 Q 8 70 14 55 Z" fill={secondary} />
            {/* Nose */}
            <ellipse cx="50" cy="70" rx="4.5" ry="3.5" fill="#111" />
          </g>
        )}

        {animal === 'rabbit' && (
          <g>
            {/* Long vertical ears */}
            <ellipse cx="30" cy="22" rx="9" ry="22" fill={primary} />
            <ellipse cx="30" cy="22" rx="5" ry="17" fill={secondary} />
            <ellipse cx="70" cy="22" rx="9" ry="22" fill={primary} />
            <ellipse cx="70" cy="22" rx="5" ry="17" fill={secondary} />
            {/* Head */}
            <circle cx="50" cy="60" r="30" fill={primary} />
            {/* Cheeks */}
            <ellipse cx="50" cy="68" rx="14" ry="10" fill={secondary} />
            {/* Nose */}
            <polygon points="47,63 53,63 50,66" fill={accent} />
            {/* Buck Teeth */}
            <rect x="46" y="74" width="4" height="6" fill="#FFF" stroke="#222" strokeWidth="1" />
            <rect x="50" y="74" width="4" height="6" fill="#FFF" stroke="#222" strokeWidth="1" />
          </g>
        )}

        {animal === 'pig' && (
          <g>
            {/* Floppy triangular ears */}
            <polygon points="15,25 35,20 20,40" fill={primary} />
            <polygon points="85,25 65,20 80,40" fill={primary} />
            {/* Head */}
            <circle cx="50" cy="56" r="32" fill={primary} />
            {/* Big Snout */}
            <ellipse cx="50" cy="66" rx="15" ry="10" fill={secondary} stroke="#FF1493" strokeWidth="1.5" />
            {/* Nostrils */}
            <circle cx="44" cy="66" r="3" fill="#111" />
            <circle cx="56" cy="66" r="3" fill="#111" />
          </g>
        )}

        {animal === 'panda' && (
          <g>
            {/* Round ears */}
            <circle cx="22" cy="25" r="11" fill="#111" />
            <circle cx="78" cy="25" r="11" fill="#111" />
            {/* Head */}
            <circle cx="50" cy="56" r="33" fill="#FFF" stroke="#DDD" strokeWidth="1" />
            {/* Big black eye patches */}
            <ellipse cx="36" cy="52" rx="9" ry="11" fill="#111" />
            <ellipse cx="64" cy="52" rx="9" ry="11" fill="#111" />
            {/* Muzzle */}
            <ellipse cx="50" cy="66" rx="11" ry="8" fill="#FFF" />
            <ellipse cx="50" cy="64" rx="4" ry="2.5" fill="#111" />
          </g>
        )}

        {animal === 'koala' && (
          <g>
            {/* Fluffy ears */}
            <circle cx="15" cy="35" r="16" fill={primary} />
            <circle cx="15" cy="35" r="10" fill={secondary} />
            <circle cx="85" cy="35" r="16" fill={primary} />
            <circle cx="85" cy="35" r="10" fill={secondary} />
            {/* Head */}
            <ellipse cx="50" cy="56" rx="34" ry="30" fill={primary} />
            {/* Big dark oval nose */}
            <ellipse cx="50" cy="58" rx="10" ry="16" fill="#2D3748" />
          </g>
        )}

        {animal === 'frog' && (
          <g>
            {/* Bulging eyes */}
            <circle cx="32" cy="28" r="11" fill={primary} />
            <circle cx="32" cy="28" r="8" fill="#FFF" />
            <circle cx="32" cy="28" r="3.5" fill="#111" />
            <circle cx="68" cy="28" r="11" fill={primary} />
            <circle cx="68" cy="28" r="8" fill="#FFF" />
            <circle cx="68" cy="28" r="3.5" fill="#111" />
            {/* Head */}
            <ellipse cx="50" cy="60" rx="36" ry="28" fill={primary} />
            {/* Wide happy mouth */}
            <path d="M 28 62 Q 50 82 72 62" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Blush cheeks */}
            <circle cx="25" cy="58" r="5" fill={secondary} opacity="0.8" />
            <circle cx="75" cy="58" r="5" fill={secondary} opacity="0.8" />
          </g>
        )}

        {animal === 'bird' && (
          <g>
            {/* Head */}
            <circle cx="50" cy="52" r="32" fill={primary} />
            {/* Eyes */}
            <circle cx="36" cy="46" r="7" fill="#FFF" />
            <circle cx="36" cy="46" r="3" fill="#111" />
            <circle cx="64" cy="46" r="7" fill="#FFF" />
            <circle cx="64" cy="46" r="3" fill="#111" />
            {/* Beak */}
            <polygon points="42,50 58,50 50,66" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            {/* Cheeks */}
            <circle cx="26" cy="54" r="4.5" fill={secondary} opacity="0.8" />
            <circle cx="74" cy="54" r="4.5" fill={secondary} opacity="0.8" />
          </g>
        )}

        {animal === 'dragon' && (
          <g>
            {/* Side horns */}
            <path d="M 22 28 Q 8 18 14 6 Q 22 18 28 26 Z" fill={accent} />
            <path d="M 78 28 Q 92 18 86 6 Q 78 18 72 26 Z" fill={accent} />
            {/* Head */}
            <polygon points="50,15 16,42 22,85 50,95 78,85 84,42" fill={primary} />
            {/* Scales details */}
            <path d="M 50 30 L 46 38 L 54 38 Z" fill={secondary} opacity="0.5" />
            <path d="M 42 45 L 38 53 L 46 53 Z" fill={secondary} opacity="0.5" />
            <path d="M 58 45 L 54 53 L 62 53 Z" fill={secondary} opacity="0.5" />
            {/* Snout */}
            <polygon points="36,70 64,70 50,92" fill={secondary} />
            {/* Reptilian slits eyes done in main eyes block */}
          </g>
        )}

        {animal === 'lion' && (
          <g>
            {/* Fluffy Mane */}
            <path d="M 50 10 C 35 12 20 20 16 35 C 10 50 14 65 24 76 C 35 88 50 92 66 88 C 80 84 90 70 90 54 C 90 35 78 15 50 10 Z" fill="#D97706" stroke="#92400E" strokeWidth="2.5" />
            {/* Inner Ears */}
            <circle cx="28" cy="28" r="9" fill={primary} />
            <circle cx="72" cy="28" r="9" fill={primary} />
            {/* Face */}
            <circle cx="50" cy="54" r="28" fill={primary} />
            {/* Snout */}
            <ellipse cx="50" cy="64" rx="11" ry="8" fill={secondary} />
            {/* Nose */}
            <polygon points="46,58 54,58 50,64" fill="#111" />
          </g>
        )}

        {animal === 'wolf' && (
          <g>
            {/* Alert Wolf Ears */}
            <polygon points="15,16 35,36 12,42" fill={primary} />
            <polygon points="20,22 32,34 18,38" fill={secondary} />
            <polygon points="85,16 65,36 88,42" fill={primary} />
            <polygon points="80,22 68,34 82,38" fill={secondary} />
            {/* Head */}
            <polygon points="50,22 20,52 28,82 50,92 72,82 80,52" fill={primary} />
            {/* Muzzle */}
            <polygon points="38,62 62,62 50,86" fill={secondary} />
            <ellipse cx="50" cy="80" rx="4.5" ry="3" fill="#111" />
          </g>
        )}

        {animal === 'penguin' && (
          <g>
            {/* Tuxedo Head */}
            <circle cx="50" cy="52" r="32" fill={primary} />
            {/* White face/belly mask */}
            <ellipse cx="38" cy="54" rx="14" ry="18" fill="#FFF" />
            <ellipse cx="62" cy="54" rx="14" ry="18" fill="#FFF" />
            <ellipse cx="50" cy="62" rx="18" ry="14" fill="#FFF" />
            {/* Orange beak */}
            <polygon points="44,52 56,52 50,64" fill="#F59E0B" />
          </g>
        )}

        {animal === 'elephant' && (
          <g>
            {/* Large round ears */}
            <circle cx="18" cy="46" r="22" fill={primary} />
            <circle cx="18" cy="46" r="14" fill="#FFA500" opacity="0.3" />
            <circle cx="82" cy="46" r="22" fill={primary} />
            <circle cx="82" cy="46" r="14" fill="#FFA500" opacity="0.3" />
            {/* Head */}
            <ellipse cx="50" cy="54" rx="30" ry="26" fill={primary} />
            {/* Trunk */}
            <path d="M 46 54 L 46 80 Q 46 92 56 90 Q 64 88 58 80 L 54 54 Z" fill={primary} stroke="#4B5563" strokeWidth="1" />
          </g>
        )}

        {animal === 'snake' && (
          <g>
            {/* Forked tongue */}
            <path d="M 50 72 L 50 88 M 50 88 L 45 94 M 50 88 L 55 94" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Coiled neck */}
            <ellipse cx="50" cy="74" rx="28" ry="11" fill={secondary} />
            {/* Head */}
            <ellipse cx="50" cy="52" rx="24" ry="21" fill={primary} />
            {/* Scales crown */}
            <polygon points="42,32 50,22 58,32" fill={accent} />
          </g>
        )}

        {animal === 'badger' && (
          <g>
            {/* Head base */}
            <ellipse cx="50" cy="55" rx="34" ry="28" fill={primary} />
            {/* White stripes */}
            <polygon points="42,27 50,83 58,27" fill={secondary} />
            <path d="M 16 50 Q 30 78 50 72 Q 70 78 84 50 L 76 83 L 24 83 Z" fill={secondary} />
            {/* Eye dark strips */}
            <polygon points="32,32 40,32 46,65 34,65" fill={primary} />
            <polygon points="68,32 60,32 54,65 66,65" fill={primary} />
            {/* Nose */}
            <circle cx="50" cy="74" r="4.5" fill="#111" />
          </g>
        )}

        {/* Universal Eyes (overridden for specific shapes like reptiles/dragons) */}
        {animal !== 'bird' && animal !== 'panda' && (
          <g>
            {/* Left Eye */}
            <circle cx="34" cy="48" r="6" fill="#FFF" />
            {animal === 'dragon' || animal === 'snake' ? (
              <line x1="34" y1="42" x2="34" y2="54" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            ) : (
              <circle cx="34" cy="48" r="3.2" fill="#111" />
            )}
            {/* Right Eye */}
            <circle cx="66" cy="48" r="6" fill="#FFF" />
            {animal === 'dragon' || animal === 'snake' ? (
              <line x1="66" y1="42" x2="66" y2="54" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            ) : (
              <circle cx="66" cy="48" r="3.2" fill="#111" />
            )}
          </g>
        )}

        {/* Universal Mouth and Blush for expressive cute face */}
        {animal !== 'frog' && animal !== 'bird' && (
          <g>
            {/* Little pink blush */}
            <ellipse cx="23" cy="58" rx="4" ry="2" fill="#FDA4AF" opacity="0.6" />
            <ellipse cx="77" cy="58" rx="4" ry="2" fill="#FDA4AF" opacity="0.6" />
            {/* Sweet curved mouth */}
            {animal !== 'snake' && animal !== 'badger' && animal !== 'koala' && (
              <path d="M 45 61 Q 50 65 55 61" stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        )}

        {/* Glasses Accessory */}
        {accList.includes('glasses') && (
          <g>
            <circle cx="34" cy="48" r="10.5" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <circle cx="66" cy="48" r="10.5" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <line x1="44.5" y1="48" x2="55.5" y2="48" stroke="#F59E0B" strokeWidth="2" />
          </g>
        )}

        {/* Sword Accessory */}
        {accList.includes('sword') && (
          <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
            {/* Steel blade */}
            <path d="M 85 45 L 105 25" stroke="#E5E7EB" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 86 44 L 104 26" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Crossguard */}
            <line x1="83" y1="38" x2="93" y2="48" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
            {/* Hilt */}
            <line x1="85" y1="45" x2="79" y2="51" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
            <circle cx="78" cy="52" r="2" fill="#D97706" />
          </g>
        )}

        {/* Armor Plate Overlay */}
        {accList.includes('armor') && (
          <path d="M 28 72 L 35 90 L 65 90 L 72 72 Z" fill="#9CA3AF" stroke="#4B5563" strokeWidth="2" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))" />
        )}

        {/* Hat Accessory */}
        {accList.includes('hat') && (
          <g filter="drop-shadow(0 2px 5px rgba(0,0,0,0.35))">
            {/* Pointy cone hat */}
            <polygon points="25,26 50,-8 75,26" fill="#4F46E5" />
            {/* Wide brim */}
            <ellipse cx="50" cy="26" rx="30" ry="6" fill="#312E81" />
            {/* Gold buckle */}
            <rect x="46" y="14" width="8" height="6" fill="#FBBF24" rx="1.5" />
            <rect x="48" y="16" width="4" height="2" fill="#4F46E5" />
          </g>
        )}

        {/* Crown Accessory */}
        {accList.includes('crown') && (
          <g filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))">
            {/* Golden crown base */}
            <path d="M 32 20 L 36 32 L 50 24 L 64 32 L 68 20 L 59 27 L 50 14 L 41 27 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
            {/* Ruby Gemstones */}
            <circle cx="32" cy="19" r="2.5" fill="#EF4444" />
            <circle cx="50" cy="13" r="2.5" fill="#3B82F6" />
            <circle cx="68" cy="19" r="2.5" fill="#10B981" />
            <circle cx="50" cy="23" r="2" fill="#EF4444" />
          </g>
        )}
      </svg>
    </div>
  );
};
