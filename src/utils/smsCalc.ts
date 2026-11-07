/**
 * GSM-7 and Unicode SMS Character & Concatenation Calculator for MyVet
 * Mirrors backend calculation in server/utils/smsSegmentation.ts for 100% parity.
 */

export const GSM7_BASIC_CHARACTERS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

export const GSM7_EXTENDED_CHARACTERS = "^{}\\[~]|€";

export interface ClientSmsCalcResult {
  encoding: 'GSM-7' | 'UCS-2 (Unicode)';
  characterCount: number;
  encodedLength: number;
  segmentCount: number;
  remainingInCurrentSegment: number;
  maxPerSegment: number;
  isConcatenated: boolean;
  containsUnicode: boolean;
  nonGsmCharacters: string[];
  // Parity aliases
  segments: number;
  charCount: number;
  remainingInSegment: number;
  hasNonGsmChars: boolean;
  invalidGsmChars: string[];
}

export function calculateClientSmsSegments(text: string): ClientSmsCalcResult {
  if (!text) {
    return {
      encoding: 'GSM-7',
      characterCount: 0,
      encodedLength: 0,
      segmentCount: 0,
      remainingInCurrentSegment: 160,
      maxPerSegment: 160,
      isConcatenated: false,
      containsUnicode: false,
      nonGsmCharacters: [],
      segments: 0,
      charCount: 0,
      remainingInSegment: 160,
      hasNonGsmChars: false,
      invalidGsmChars: []
    };
  }

  let isGSM7 = true;
  let gsm7Length = 0;
  const nonGsmChars: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (GSM7_BASIC_CHARACTERS.includes(char)) {
      gsm7Length += 1;
    } else if (GSM7_EXTENDED_CHARACTERS.includes(char)) {
      gsm7Length += 2; // Escape sequence + character
    } else {
      isGSM7 = false;
      if (!nonGsmChars.includes(char)) {
        nonGsmChars.push(char);
      }
    }
  }

  const charCount = text.length;

  if (isGSM7) {
    let segmentCount = 1;
    let remaining = 160 - gsm7Length;

    if (gsm7Length > 160) {
      segmentCount = Math.ceil(gsm7Length / 153);
      remaining = segmentCount * 153 - gsm7Length;
    }

    return {
      encoding: 'GSM-7',
      characterCount: charCount,
      encodedLength: gsm7Length,
      segmentCount,
      remainingInCurrentSegment: Math.max(0, remaining),
      maxPerSegment: segmentCount > 1 ? 153 : 160,
      isConcatenated: segmentCount > 1,
      containsUnicode: false,
      nonGsmCharacters: [],
      segments: segmentCount,
      charCount,
      remainingInSegment: Math.max(0, remaining),
      hasNonGsmChars: false,
      invalidGsmChars: []
    };
  }

  // UCS-2 (Unicode)
  let segmentCount = 1;
  let remaining = 70 - charCount;

  if (charCount > 70) {
    segmentCount = Math.ceil(charCount / 67);
    remaining = segmentCount * 67 - charCount;
  }

  return {
    encoding: 'UCS-2 (Unicode)',
    characterCount: charCount,
    encodedLength: charCount,
    segmentCount,
    remainingInCurrentSegment: Math.max(0, remaining),
    maxPerSegment: segmentCount > 1 ? 67 : 70,
    isConcatenated: segmentCount > 1,
    containsUnicode: true,
    nonGsmCharacters: nonGsmChars.slice(0, 10),
    segments: segmentCount,
    charCount,
    remainingInSegment: Math.max(0, remaining),
    hasNonGsmChars: true,
    invalidGsmChars: nonGsmChars.slice(0, 10)
  };
}
