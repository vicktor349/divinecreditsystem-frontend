import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Call backend signout to clear httpOnly auth_token cookie on the backend
  try {
    const backendUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
    await fetch(`${backendUrl}/auth/signout`, {
      method: 'POST',
      headers: { Cookie: req.headers.cookie ?? '' },
    });
  } catch {
    // non-critical — continue with local cookie clear
  }

  // Clear the frontend cookies
  res.setHeader('Set-Cookie', [
    serialize('token', '', { httpOnly: true, maxAge: 0, path: '/' }),
    serialize('user', '', { httpOnly: false, maxAge: 0, path: '/' }),
  ]);

  return res.status(200).json({ message: 'Signed out successfully' });
}
