/**
 * Algeria Phone Number Normalization & Validation Utility
 * Supports Algerian mobile operators:
 * - Ooredoo (05xx)
 * - Mobilis (06xx)
 * - Djezzy (07xx)
 * - Fixe / Landline (02x, 03x, 04x)
 * 
 * Standardizes all numbers to E.164 (+213...) format.
 * Cleans punctuation, handles duplicate country codes, and validates lengths.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  raw: string;
  e164: string; // e.g. +213551234567
  national: string; // e.g. 0551 23 45 67
  operator: 'Ooredoo' | 'Mobilis' | 'Djezzy' | 'Fixe' | 'Inconnu';
  carrier?: 'Ooredoo' | 'Mobilis' | 'Djezzy' | 'Fixe' | 'Inconnu';
  prefix: string;
  error?: string;
  note?: string;
}

export function normalizeAlgerianPhone(raw: string | null | undefined): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      raw: raw || '',
      e164: '',
      national: '',
      operator: 'Inconnu',
      carrier: 'Inconnu',
      prefix: '',
      error: 'Numéro de téléphone vide'
    };
  }

  // 1. Strip all whitespace, hyphens, dots, parentheses, slashes
  let cleaned = raw.trim().replace(/[\s\-\.\(\)\\\/]/g, '');

  // 2. Handle duplicate or repeated country codes (e.g. +213+213..., 0021300213..., +213213...)
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

  // 4. Validate exact 9-digit subscriber body for Algerian numbers
  // Valid Algerian mobile/landline numbers without country code have exactly 9 digits:
  // e.g. 551234567, 661234567, 770987654
  if (!/^\d{9}$/.test(cleaned)) {
    return {
      isValid: false,
      raw,
      e164: raw,
      national: raw,
      operator: 'Inconnu',
      carrier: 'Inconnu',
      prefix: cleaned.substring(0, 2),
      error: cleaned.length < 9 
        ? `Numéro trop court (${cleaned.length} chiffres au lieu de 9)` 
        : `Numéro trop long (${cleaned.length} chiffres au lieu de 9)`
    };
  }

  const firstDigit = cleaned.charAt(0);
  let operator: PhoneValidationResult['operator'] = 'Inconnu';

  switch (firstDigit) {
    case '5':
      operator = 'Ooredoo';
      break;
    case '6':
      operator = 'Mobilis';
      break;
    case '7':
      operator = 'Djezzy';
      break;
    case '2':
    case '3':
    case '4':
      operator = 'Fixe';
      break;
    default:
      return {
        isValid: false,
        raw,
        e164: `+213${cleaned}`,
        national: `0${cleaned}`,
        operator: 'Inconnu',
        carrier: 'Inconnu',
        prefix: cleaned.substring(0, 2),
        error: `Préfixe opérateur non attribué (les mobiles algériens commencent par 05, 06 ou 07)`
      };
  }

  const e164 = `+213${cleaned}`;
  // Standard Algerian National Format: 0551 23 45 67
  const national = `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;

  return {
    isValid: true,
    raw,
    e164,
    national,
    operator,
    carrier: operator,
    prefix: `0${cleaned.substring(0, 2)}`,
    note: 'Opérateur identifié par préfixe historique (sans garantie de portabilité MNP active)'
  };
}
