export interface Occasion {
  id: string;
  name: string;
  month: number; // 1-based (1 = Jan, 12 = Dec)
  day: number;
  description: string;
  minReward: number;
  maxReward: number;
}

// Full set of major Philippine holidays and celebratory occasions
export const PHILIPPINE_OCCASIONS: Occasion[] = [
  {
    id: 'new_year',
    name: "New Year's Day",
    month: 1,
    day: 1,
    description: "Manigong Bagong Taon! Kickstart the year with roaring fireworks and abundance.",
    minReward: 3000,
    maxReward: 6000
  },
  {
    id: 'chinese_new_year',
    name: "Chinese New Year",
    month: 2,
    day: 17, // 2026 specific date, or celebrated mid-Feb
    description: "Kung Hei Fat Choi! Celebrate the Year of the Fire Horse with sweet tikoy.",
    minReward: 2000,
    maxReward: 4500
  },
  {
    id: 'valentines_day',
    name: "Valentine's Day",
    month: 2,
    day: 14,
    description: "Araw ng mga Puso! Spread sweet love and share Prince Gyuuun's heart cakes.",
    minReward: 1500,
    maxReward: 3500
  },
  {
    id: 'edsa_day',
    name: "EDSA People Power Anniversary",
    month: 2,
    day: 25,
    description: "Remembering unity, courage, and peaceful democracy in yellow ribbons.",
    minReward: 1000,
    maxReward: 2500
  },
  {
    id: 'maundy_thursday',
    name: "Maundy Thursday (Holy Week)",
    month: 4,
    day: 2, // 2026 specific
    description: "A solemn time for reflection, Bisita Iglesia, and peaceful family retreats.",
    minReward: 1500,
    maxReward: 3000
  },
  {
    id: 'good_friday',
    name: "Good Friday (Holy Week)",
    month: 4,
    day: 3, // 2026 specific
    description: "A holy day of solemn penance, silence, and traditional Senakulo readings.",
    minReward: 1500,
    maxReward: 3000
  },
  {
    id: 'easter_sunday',
    name: "Easter Sunday (Holy Week)",
    month: 4,
    day: 5, // 2026 specific
    description: "Muling Pagkabuhay! Celebrate renewal and hunt for sweet golden egg carrots.",
    minReward: 4000,
    maxReward: 8000
  },
  {
    id: 'araw_ng_kagitingan',
    name: "Day of Valor (Araw ng Kagitingan)",
    month: 4,
    day: 9,
    description: "Honoring the brave Filipino and American defenders of Bataan.",
    minReward: 1500,
    maxReward: 3000
  },
  {
    id: 'labor_day',
    name: "Labor Day",
    month: 5,
    day: 1,
    description: "Araw ng Paggawa! Saluting the hard work of everyday heroes in our workforce.",
    minReward: 1200,
    maxReward: 2800
  },
  {
    id: 'independence_day',
    name: "Independence Day (Araw ng Kalayaan)",
    month: 6,
    day: 12,
    description: "Maligayang Araw ng Kalayaan! Wave the three stars and the sun with pride.",
    minReward: 3500,
    maxReward: 7000
  },
  {
    id: 'fil_am_friendship',
    name: "Philippine-American Friendship Day",
    month: 7,
    day: 4,
    description: "Celebrating historical ties and cultural synergy with our global friends.",
    minReward: 1500,
    maxReward: 3500
  },
  {
    id: 'gyuuun_feast',
    name: "Prince Gyuuun's Royal Feast",
    month: 7,
    day: 11,
    description: "A grand royal banquet is thrown in honor of our bravest matching Knights! Today, everyone feasts on golden carrots!",
    minReward: 3500,
    maxReward: 7500
  },
  {
    id: 'national_heroes_day',
    name: "National Heroes Day",
    month: 8,
    day: 31, // Last Monday of Aug 2026
    description: "Honoring both known and unsung heroes who fought for our beautiful nation.",
    minReward: 2000,
    maxReward: 4500
  },
  {
    id: 'halloween',
    name: "All Saints' Eve / Halloween",
    month: 10,
    day: 31,
    description: "Undas begins! Light candles and share spooky horror stories of Aswangs.",
    minReward: 2500,
    maxReward: 5000
  },
  {
    id: 'all_saints_day',
    name: "All Saints' Day (Todos los Santos)",
    month: 11,
    day: 1,
    description: "A warm family reunion at the memorial parks with candles, prayers, and food.",
    minReward: 2000,
    maxReward: 4000
  },
  {
    id: 'all_souls_day',
    name: "All Souls' Day",
    month: 11,
    day: 2,
    description: "Offering deep prayers, incense, and fond memories for our departed loved ones.",
    minReward: 1500,
    maxReward: 3000
  },
  {
    id: 'bonifacio_day',
    name: "Bonifacio Day",
    month: 11,
    day: 30,
    description: "Saluting Andres Bonifacio, the Father of the Philippine Revolution.",
    minReward: 1500,
    maxReward: 3500
  },
  {
    id: 'immaculate_conception',
    name: "Feast of the Immaculate Conception",
    month: 12,
    day: 8,
    description: "A special day of devotion to the Patroness of the Philippine islands.",
    minReward: 1500,
    maxReward: 3000
  },
  {
    id: 'christmas_eve',
    name: "Christmas Eve (Noche Buena)",
    month: 12,
    day: 24,
    description: "Gather round the Noche Buena table for delicious hamon and queso de bola!",
    minReward: 4000,
    maxReward: 8000
  },
  {
    id: 'christmas_day',
    name: "Christmas Day",
    month: 12,
    day: 25,
    description: "Maligayang Pasko! Gift-giving, family laughter, and colorful parol lights.",
    minReward: 5000,
    maxReward: 10000
  },
  {
    id: 'rizal_day',
    name: "Rizal Day",
    month: 12,
    day: 30,
    description: "Remembering Dr. Jose Rizal, national hero of intellectual freedom and reform.",
    minReward: 2000,
    maxReward: 4500
  },
  {
    id: 'new_years_eve',
    name: "New Year's Eve (Bisperas)",
    month: 12,
    day: 31,
    description: "Media Noche feasts, loud trumpets, and wearing polka dots for good luck!",
    minReward: 4000,
    maxReward: 8000
  }
];

/**
 * Find an occasion for a specific month and day.
 */
export function getOccasionForDate(month: number, day: number): Occasion | null {
  return PHILIPPINE_OCCASIONS.find(o => o.month === month && o.day === day) || null;
}

/**
 * Get all occasions occurring in a specific month.
 */
export function getOccasionsForMonth(month: number): Occasion[] {
  return PHILIPPINE_OCCASIONS.filter(o => o.month === month);
}

/**
 * Helper to generate an array of numbers representing days in a month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Helper to get the 1st day of the month as a weekday offset (0 = Sun, 6 = Sat).
 */
export function getFirstDayOffset(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Returns month names in English / Filipino
 */
export const MONTH_NAMES = [
  "January / Enero",
  "February / Pebrero",
  "March / Marso",
  "April / Abril",
  "May / Mayo",
  "June / Hunyo",
  "July / Hulyo",
  "August / Agosto",
  "September / Setyembre",
  "October / Oktubre",
  "November / Nobyembre",
  "December / Disyembre"
];
