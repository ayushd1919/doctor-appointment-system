import { Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';

export function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
}
