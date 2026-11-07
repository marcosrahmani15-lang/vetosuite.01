/**
 * Algerian Phone Number Normalization and Carrier Detection
 * Mirrors backend logic in server/utils/phone.ts for 100% consistency.
 */

export interface PhoneValidation {
  raw: string;
  national: string;
  e164: string;
  carrier: 'Ooredoo' | 'Mobilis' | 'Djezzy' | 'Fixe' | 'Inconnu';
  operator?: 'Ooredoo' | 'Mobilis' | 'Djezzy' | 'Fixe' | 'Inconnu';
  isValid: boolean;
  prefix: string;
  error?: string;
  note?: string;
}

export function formatAlgerianPhone(input: string): PhoneValidation {
  if (!input || !input.trim()) {
    return {
      raw: input || '',
      national: '',
      e164: '',
      carrier: 'Inconnu',
      operator: 'Inconnu',
      isValid: false,
      prefix: '',
      error: 'Numéro de téléphone vide'
    };
  }

  // 1. Strip all whitespace, hyphens, dots, parentheses, slashes
  let cleaned = input.trim().replace(/[\s\-\.\(\)\\\/]/g, '');

  // 2. Handle duplicate or repeated country codes
  while (cleaned.startsWith('+213') || cleaned.startsWith('00213') || cleaned.startsWith('213')) {
    if (cleaned.startsWith('+213')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('00213')) {
      cleaned = cleaned.substring(5);
    } else if (cleaned.startsWith('213') && cleaned.length > 9) {
      cleaned = cleaned.substring(3);
    } else {
      break;
    }
  }

  // 3. Remove leading zero if present after country code stripping
  while (cleaned.startsWith('0') && cleaned.length > 9) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = cleaned.substring(1);
  }

  // 4. Validate exact 9-digit subscriber body
  if (!/^\d{9}$/.test(cleaned)) {
    return {
      raw: input,
      national: input,
      e164: input,
      carrier: 'Inconnu',
      operator: 'Inconnu',
      isValid: false,
      prefix: cleaned.substring(0, 2),
      error: cleaned.length < 9 
        ? `Numéro trop court (${cleaned.length} chiffres au lieu de 9)` 
        : `Numéro trop long (${cleaned.length} chiffres au lieu de 9)`
    };
  }

  const firstDigit = cleaned.charAt(0);
  let carrier: PhoneValidation['carrier'] = 'Inconnu';

  switch (firstDigit) {
    case '5':
      carrier = 'Ooredoo';
      break;
    case '6':
      carrier = 'Mobilis';
      break;
    case '7':
      carrier = 'Djezzy';
      break;
    case '2':
    case '3':
    case '4':
      carrier = 'Fixe';
      break;
    default:
      return {
        raw: input,
        national: `0${cleaned}`,
        e164: `+213${cleaned}`,
        carrier: 'Inconnu',
        operator: 'Inconnu',
        isValid: false,
        prefix: cleaned.substring(0, 2),
        error: `Préfixe non attribué en Algérie`
      };
  }

  const e164 = `+213${cleaned}`;
  const national = `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;

  return {
    raw: input,
    national,
    e164,
    carrier,
    operator: carrier,
    isValid: true,
    prefix: `0${cleaned.substring(0, 2)}`,
    note: 'Opérateur indicatif (sous réserve de portabilité MNP active)'
  };
}
