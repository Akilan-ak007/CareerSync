import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'placement_platform_super_jwt_secret_key_2026_hackathon_complex';
}

const TOKEN_EXPIRY = '24h'; // Long enough session for convenient hackathon testing

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    return null;
  }
}

