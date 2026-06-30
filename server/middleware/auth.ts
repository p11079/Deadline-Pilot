/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

// Load config dynamically to support dynamic project ID and custom databases
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('[Auth Middleware] Loaded firebase configuration successfully.');
  }
} catch (err) {
  console.error('[Auth Middleware] Failed to parse firebase-applet-config.json', err);
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken | { uid: string; email: string; name: string };
    }
  }
}

let isFirebaseAdminInitialized = false;

function initFirebaseAdmin() {
  if (isFirebaseAdminInitialized) return true;
  
  try {
    const apps = getApps();
    if (apps.length > 0) {
      isFirebaseAdminInitialized = true;
      return true;
    }

    // If we have service account JSON in env
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
      isFirebaseAdminInitialized = true;
      console.log('Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: applicationDefault()
      });
      isFirebaseAdminInitialized = true;
      console.log('Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      // In local dev without credentials, we can try applicationDefault first, then project-default mode
      const projectId = firebaseConfig?.projectId || "eloquent-signal-gv8b6";
      try {
        initializeApp({
          credential: applicationDefault(),
          projectId: projectId
        });
        isFirebaseAdminInitialized = true;
        console.log(`Firebase Admin initialized with applicationDefault and projectId: ${projectId}`);
      } catch (err) {
        initializeApp({
          projectId: projectId
        });
        isFirebaseAdminInitialized = true;
        console.log(`Firebase Admin initialized with projectId: ${projectId}`);
      }
    }
    return true;
  } catch (error) {
    console.warn('Firebase Admin SDK could not be fully initialized. API routes will run in offline fallback mode.', error);
    return false;
  }
}

/**
 * Express middleware to verify Firebase ID Tokens.
 * Expects header: Authorization: Bearer <token>
 */
export async function authenticateFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Missing or malformed Authorization header with Bearer token.' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const initialized = initFirebaseAdmin();
    if (!initialized) {
      // If Admin SDK can't be initialized (no credentials in preview sandbox), 
      // we provide a safe fallback for demonstration or mock-token decoding 
      // to keep development fluid and avoid crashing.
      if (idToken.startsWith('mock-token-')) {
        const email = idToken.replace('mock-token-', '');
        req.user = {
          uid: `mock-uid-${Buffer.from(email).toString('base64')}`,
          email: email,
          name: email.split('@')[0]
        };
        return next();
      }
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Firebase Admin SDK is not configured on the backend. Please set up FIREBASE_SERVICE_ACCOUNT.'
      });
    }

    // Verify token with Firebase Admin Auth
    const authInstance = getAuth();
    const decodedToken = await authInstance.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error);
    
    // Provide nice user-friendly messages for different Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'The provided authentication token has expired. Please log in again.' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Failed to verify authentication token.' 
    });
  }
}
