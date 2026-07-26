import { VegvisrUser } from '../types';

export interface SendMagicLinkResponse {
  success: boolean;
  message: string;
}

/**
 * 1. Send Magic Link
 * Endpoint: POST https://cookie.vegvisr.org/login/magic/send
 * Body: { "email": email, "redirectUrl": window.location.href }
 */
export async function sendMagicLink(
  email: string,
  redirectUrl: string = window.location.href
): Promise<SendMagicLinkResponse> {
  try {
    const payload = { email, redirectUrl };

    // Try direct endpoint
    let res = await fetch('https://cookie.vegvisr.org/login/magic/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    // Fallback to proxy if direct request fails or is blocked
    if (!res || !res.ok) {
      res = await fetch('/api/auth/proxy/send-magic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success !== false) {
      return {
        success: true,
        message: data.message || `Magic link successfully sent to ${email}! Please check your email inbox to verify.`,
      };
    } else {
      return {
        success: false,
        message: data.error || data.message || 'Failed to send magic link. Please try again.',
      };
    }
  } catch (err: any) {
    console.error('Error sending magic link:', err);
    return {
      success: false,
      message: err.message || 'Network error while sending magic link.',
    };
  }
}

/**
 * 2. Verify magic link token & fetch user details on App Mount
 * Flow:
 *  a. GET https://cookie.vegvisr.org/login/magic/verify?token=${magicToken}
 *     Expect: { "success": true, "email": "user@example.com" }
 *  b. GET https://api.vegvisr.org/get-auth-token with Header 'X-Email': email
 *     Expect: { "user_id": "...", "emailVerificationToken": "..." }
 *  c. GET https://dashboard.vegvisr.org/get-role?email=${email}
 *     Expect: { "role": "admin" | "user" }
 *  d. Return VegvisrUser & save to localStorage
 */
export async function verifyAndAuthenticateMagicToken(magicToken: string): Promise<VegvisrUser> {
  // Step a: Verify token
  const verifyRes = await fetch(
    `https://cookie.vegvisr.org/login/magic/verify?token=${encodeURIComponent(magicToken)}`
  );

  if (!verifyRes.ok) {
    throw new Error('Magic token verification request failed.');
  }

  const verifyData = await verifyRes.json();
  if (!verifyData.success || !verifyData.email) {
    throw new Error(verifyData.error || 'Magic link token is invalid or expired.');
  }

  const email = verifyData.email;

  // Step b: Fetch role + user data from dashboard.vegvisr.org (same endpoints the Contacts app uses)
  let role = 'user';
  let user_id = email;
  let emailVerificationToken = '';

  try {
    const roleRes = await fetch(`https://dashboard.vegvisr.org/get-role?email=${encodeURIComponent(email)}`);
    if (!roleRes.ok) throw new Error(`User role unavailable (status: ${roleRes.status})`);
    const roleData = await roleRes.json();
    if (!roleData.role) throw new Error('Unable to retrieve user role.');
    role = roleData.role;

    const userDataRes = await fetch(`https://dashboard.vegvisr.org/userdata?email=${encodeURIComponent(email)}`);
    if (!userDataRes.ok) throw new Error(`Unable to fetch user data (status: ${userDataRes.status})`);
    const userData = await userDataRes.json();
    user_id = userData.user_id || email;
    emailVerificationToken = userData.emailVerificationToken || '';
  } catch (err) {
    console.warn('Could not fetch full user context, defaulting to basic user record', err);
  }

  // Step c: Construct user object
  const user: VegvisrUser = {
    email,
    role,
    user_id,
    emailVerificationToken,
  };

  // Store user and token in localStorage
  saveUserToLocalStorage(user);

  return user;
}

/**
 * Save user object and token to localStorage
 */
export function saveUserToLocalStorage(user: VegvisrUser) {
  localStorage.setItem('user', JSON.stringify(user));
  if (user.emailVerificationToken) {
    localStorage.setItem('emailVerificationToken', user.emailVerificationToken);
  }
}

/**
 * 3. Restore user from localStorage
 */
export function getUserFromLocalStorage(): VegvisrUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email) {
      return parsed as VegvisrUser;
    }
  } catch (err) {
    console.warn('Failed to parse user from localStorage', err);
  }
  return null;
}

/**
 * 4. Dev Bypass Mode User Object
 */
export function getDevBypassUser(): VegvisrUser {
  return {
    email: 'dev@vegvisr.org',
    role: 'admin',
    user_id: 'dev-user-id',
    emailVerificationToken: 'b1ca2967e8165ec02fdf039d9e916af4005f7388',
  };
}

/**
 * 5. Logout User
 */
export function logoutVegvisrUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('emailVerificationToken');
}
