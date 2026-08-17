/**
 * Countdown and Date Utilities for Upcoming Courses (বাংলা ক্যালকুলেটর ও ফরম্যাটিং)
 */

export const toBengaliDigits = (num: number | string): string => {
  const bengaliNumerals: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(num).replace(/[0-9]/g, (digit) => bengaliNumerals[digit] || digit);
};

export const bengaliMonths = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export interface CountdownState {
  hasTarget: boolean;
  isPassed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedBengaliDate: string;
  formattedBengaliTime: string;
  fullBengaliDateTime: string;
  totalSecondsRemaining: number;
}

export const formatBengaliDateTime = (dateInput?: string | Date): {
  dateStr: string;
  timeStr: string;
  fullStr: string;
} => {
  if (!dateInput) {
    return { dateStr: '', timeStr: '', fullStr: '' };
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return { dateStr: '', timeStr: '', fullStr: '' };
  }

  const day = toBengaliDigits(d.getDate());
  const month = bengaliMonths[d.getMonth()] || '';
  const year = toBengaliDigits(d.getFullYear());

  let rawHours = d.getHours();
  const minutes = toBengaliDigits(String(d.getMinutes()).padStart(2, '0'));
  let period = 'সকাল';

  if (rawHours >= 12 && rawHours < 16) {
    period = 'দুপুর';
  } else if (rawHours >= 16 && rawHours < 19) {
    period = 'বিকেল';
  } else if (rawHours >= 19 || rawHours < 4) {
    period = 'রাত';
  } else {
    period = 'সকাল';
  }

  let displayHours = rawHours % 12;
  if (displayHours === 0) displayHours = 12;
  const hours = toBengaliDigits(displayHours);

  const dateStr = `${day} ${month}, ${year}`;
  const timeStr = `${period} ${hours}:${minutes} টা`;
  const fullStr = `${dateStr} (${timeStr})`;

  return { dateStr, timeStr, fullStr };
};

export const calculateCountdown = (targetDateStr?: string): CountdownState => {
  if (!targetDateStr) {
    return {
      hasTarget: false,
      isPassed: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedBengaliDate: '',
      formattedBengaliTime: '',
      fullBengaliDateTime: '',
      totalSecondsRemaining: 0,
    };
  }

  const targetTime = new Date(targetDateStr).getTime();
  if (isNaN(targetTime)) {
    return {
      hasTarget: false,
      isPassed: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedBengaliDate: '',
      formattedBengaliTime: '',
      fullBengaliDateTime: '',
      totalSecondsRemaining: 0,
    };
  }

  const now = Date.now();
  const diffMs = targetTime - now;
  const { dateStr, timeStr, fullStr } = formatBengaliDateTime(targetDateStr);

  if (diffMs <= 0) {
    return {
      hasTarget: true,
      isPassed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedBengaliDate: dateStr,
      formattedBengaliTime: timeStr,
      fullBengaliDateTime: fullStr,
      totalSecondsRemaining: 0,
    };
  }

  const totalSecondsRemaining = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecondsRemaining / (24 * 3600));
  const hours = Math.floor((totalSecondsRemaining % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
  const seconds = totalSecondsRemaining % 60;

  return {
    hasTarget: true,
    isPassed: false,
    days,
    hours,
    minutes,
    seconds,
    formattedBengaliDate: dateStr,
    formattedBengaliTime: timeStr,
    fullBengaliDateTime: fullStr,
    totalSecondsRemaining,
  };
};
