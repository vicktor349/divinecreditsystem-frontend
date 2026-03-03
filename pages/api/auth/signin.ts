import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

type SignInRequestBody = {
  email: string;
  password: string;
};

type SignInResponse = {
  message: string;
  token?: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
};

type ErrorResponse = {
  error: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignInResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password }: SignInRequestBody = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    const backendUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Authentication failed',
      });
    }

    // Extract the token - it's nested as access_token.access_token
    const token = data.access_token?.access_token || data.access_token;

    res.setHeader('Set-Cookie', [
      serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7200,
        path: '/'
      }),

      serialize('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7200,
        path: '/'
      })
    ]);

    return res.status(200).json({
      message: data.message,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      }
    });

  } catch (error) {
    console.error('Sign in error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred during sign in'
    });
  }
}