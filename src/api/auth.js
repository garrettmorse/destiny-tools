import { apiClient } from "./client.js";

/**
 * Exchange authorization code for access token
 * @param {string} code
 * @returns {Promise<[Error, null] | [null, { access_token: string; refresh_token: string; expires_in: number; membership_id: string; }]>}
 */
async function exchangeCodeForToken(code) {
  let error = null,
    response = null;
  const body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    state: 777,
  };

  try {
    const { data } = await apiClient.post("/Platform/App/OAuth/token", body, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    response = data;
  } catch (err) {
    error = err;
  }
  return [error, response];
}

/**
 * Refresh an expired access token using refresh token
 * @param {string} refreshToken
 * @returns {Promise<[Error, null] | [null, { access_token: string; refresh_token: string; expires_in: number; membership_id: string; }]>}
 */
async function refreshAccessToken(refreshToken) {
  let error = null,
    response = null;
  const body = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };

  try {
    const { data } = await apiClient.post("/Platform/App/OAuth/token", body, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    response = data;
  } catch (err) {
    error = err;
  }
  return [error, response];
}

export async function authorize(req, res, next) {
  let { BNET_AUTH: cookie } = req?.cookies;
  const { code } = req.query;
  if (!code && !cookie) {
    return res
      .status(401)
      .json({ error: "No code parameter or cookie found." });
  }

  // Exchange authorization code for token
  if (code) {
    if (typeof code !== "string") {
      return res.status(400).json({
        error: `Invalid code. Expecting a string, but got ${typeof code}.`,
      });
    }

    const [error, token] = await exchangeCodeForToken(code);
    if (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: "Failed to exchange code for Bungie token." });
    }

    // Add expiration timestamp for future refresh checks
    token.expires_at = Date.now() + token.expires_in * 1000;

    res.locals.token = token;
    cookie = token;
  }
  // Check if existing token needs refresh
  else if (cookie) {
    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const tokenExpiry = cookie.expires_at || now + cookie.expires_in * 1000;
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (tokenExpiry - now < bufferTime) {
      // Token expired or expiring soon, refresh it
      if (!cookie.refresh_token) {
        return res.status(401).json({
          error: "Token expired and no refresh token available.",
        });
      }

      const [error, newToken] = await refreshAccessToken(cookie.refresh_token);
      if (error) {
        console.error("Token refresh failed:", error);
        return res.status(401).json({
          error: "Failed to refresh token. Please re-authenticate.",
        });
      }

      // Calculate expiration timestamp
      newToken.expires_at = Date.now() + newToken.expires_in * 1000;

      // Preserve existing token properties (like d2Id, d2Type)
      const refreshedToken = { ...cookie, ...newToken };

      // Update cookie with new token
      res.cookie("BNET_AUTH", refreshedToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: newToken.expires_in * 1000,
      });

      res.locals.token = refreshedToken;
      cookie = refreshedToken;
    }
  }

  next();
}
