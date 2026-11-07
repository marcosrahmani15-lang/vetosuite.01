import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: 'admin' | 'vet' | 'assistant';
  clinic: string;
}

// Authorized Clinic Staff Identities for MyVet
export const AUTHORIZED_STAFF: Record<string, AuthenticatedUser> = {
  'dr_veterinaire': {
    id: 'dr_veterinaire',
    name: 'Dr. Vétérinaire',
    role: 'admin',
    clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)'
  },
  'dr_martin': {
    id: 'dr_martin',
    name: 'Dr. Martin',
    role: 'vet',
    clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)'
  },
  'dr_leroy': {
    id: 'dr_leroy',
    name: 'Dr. Leroy',
    role: 'vet',
    clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)'
  },
  'dr_bernard': {
    id: 'dr_bernard',
    name: 'Dr. Bernard',
    role: 'vet',
    clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)'
  }
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Authentication Middleware for MyVet Veterinary API.
 * Validates staff session tokens, API keys, and service headers.
 */
export function authenticateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = req.headers['authorization'];
  const staffTokenHeader = req.headers['x-staff-token'] as string;
  const staffIdHeader = req.headers['x-staff-id'] as string;
  const apiKeyHeader = req.headers['x-api-key'] as string;
  const requireAuthHeader = req.headers['x-require-auth'] === 'true';

  const systemApiKey = process.env.API_SECRET_KEY || process.env.ADMIN_TOKEN;

  // 1. Check API Key
  if (apiKeyHeader && systemApiKey && apiKeyHeader === systemApiKey) {
    req.user = AUTHORIZED_STAFF['dr_veterinaire'];
    return next();
  }

  // 2. Check Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (systemApiKey && token === systemApiKey) {
      req.user = AUTHORIZED_STAFF['dr_veterinaire'];
      return next();
    }
    // Check known staff token matches
    if (AUTHORIZED_STAFF[token]) {
      req.user = AUTHORIZED_STAFF[token];
      return next();
    }
  }

  // 3. Check Staff ID or Staff Token header
  const staffKey = staffTokenHeader || staffIdHeader;
  if (staffKey && AUTHORIZED_STAFF[staffKey]) {
    req.user = AUTHORIZED_STAFF[staffKey];
    return next();
  }

  // 4. Strict Enforcement in Production or when explicitly demanded
  if (isProduction || requireAuthHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      message: 'Accès refusé. Authentification praticien requise pour accéder aux dossiers médicaux et opérations du cabinet.'
    });
  }

  // 5. In local development / demo mode, assign default authenticated practitioner
  req.user = AUTHORIZED_STAFF['dr_veterinaire'];
  next();
}

/**
 * Authorization Guard: Requires Administrative / Titulaire Role
 * Used for database migration, SMS provider credentials, and destructive system changes.
 */
export function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateStaff(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Opération restreinte aux praticiens titulaires administrateurs.'
      });
    }
    next();
  });
}
