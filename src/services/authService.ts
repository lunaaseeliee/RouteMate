import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';
import { cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const USER_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USER_COLLECTION, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
}

export async function createOrUpdateUserProfile(
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<UserProfile> {
  const userDocRef = doc(db, USER_COLLECTION, user.uid);
  const existing = await getUserProfile(user.uid);

  const now = new Date().toISOString();

  // Check if designated system administrator email
  const isSuperAdminEmail =
    user.email === 'admin@routemate.com' ||
    user.email === 'rishidubeyji68@gmail.com';

  const resolvedName =
    user.displayName ||
    additionalData?.name ||
    additionalData?.displayName ||
    user.email?.split('@')[0] ||
    'RouteMate User';

  const resolvedPhoto =
    user.photoURL ||
    additionalData?.profilePhoto ||
    additionalData?.photoURL ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

  const resolvedRole = (isSuperAdminEmail ? 'admin' : (existing?.role || additionalData?.role || 'user')) as UserRole;
  const resolvedAccountStatus = (existing?.accountStatus || existing?.status || additionalData?.accountStatus || additionalData?.status || 'active') as UserStatus;
  const resolvedRating = existing?.rating !== undefined ? existing.rating : (additionalData?.rating !== undefined ? additionalData.rating : 0);

  const emailVerifiedStatus = Boolean(user.emailVerified);

  // Phone verification is disabled.
  // Keep this legacy value true temporarily for old profile compatibility.
  const phoneVerifiedStatus = true;

  const resolvedPhoneNumber =
    user.phoneNumber || additionalData?.phoneNumber || existing?.phoneNumber || '';

  // onboardingComplete reflects the real verification state and cannot be bypassed.
  const resolvedOnboardingComplete = Boolean(emailVerifiedStatus);

  const defaultProfile: UserProfile = {
    // Required schema fields
    uid: user.uid,
    name: resolvedName,
    email: user.email || '',
    phoneNumber: resolvedPhoneNumber,
    emailVerified: emailVerifiedStatus,
    phoneVerified: phoneVerifiedStatus,
    role: resolvedRole,
    rating: resolvedRating,
    createdAt: existing?.createdAt || now,
    accountStatus: resolvedAccountStatus,
    onboardingComplete: resolvedOnboardingComplete,

    // Backward compatibility & extended app preferences
    displayName: resolvedName,
    profilePhoto: resolvedPhoto,
    photoURL: resolvedPhoto,
    status: resolvedAccountStatus,
    isSuspended: resolvedAccountStatus === 'suspended',
    isDriver: additionalData?.isDriver ?? existing?.isDriver ?? false,
    totalRatingsCount: existing?.totalRatingsCount || 0,
    totalRidesCreated: existing?.totalRidesCreated || 0,
    totalRidesJoined: existing?.totalRidesJoined || 0,
    bio: additionalData?.bio || existing?.bio || 'RouteMate commuter enjoying smart, eco-friendly journeys.',
    lastLoginAt: now,
    preferences: existing?.preferences || additionalData?.preferences || {
      smokingAllowed: false,
      petsAllowed: true,
      musicAllowed: true,
      chatty: true,
      maxLuggage: 'medium',
    },
  };

  // Only attach optional fields if defined
  if (additionalData?.vehicle || existing?.vehicle) {
    defaultProfile.vehicle = additionalData?.vehicle || existing?.vehicle;
  }
  if (additionalData?.emergencyContact || existing?.emergencyContact) {
    defaultProfile.emergencyContact = additionalData?.emergencyContact || existing?.emergencyContact;
  }

  const sanitizedAdditionalData = { ...additionalData };
  if (!isSuperAdminEmail && existing?.role !== 'admin') {
    delete sanitizedAdditionalData.role;
    delete sanitizedAdditionalData.status;
    delete sanitizedAdditionalData.accountStatus;
    delete sanitizedAdditionalData.isSuspended;
  }

  const finalProfile = cleanForFirestore({ ...defaultProfile, ...sanitizedAdditionalData });

  try {
    await setDoc(userDocRef, finalProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USER_COLLECTION}/${user.uid}`);
  }
  return finalProfile as UserProfile;
}

/**
 * STEP 1: Registers user with Email & Password, sets display name, sends REAL Firebase verification email,
 * and creates initial Firestore user record with onboardingComplete = false.
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name: string,
  phoneNumber: string,
  isDriver?: boolean,
  vehicle?: UserProfile['vehicle']
): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`;

    if (cred.user) {
      await updateProfile(cred.user, { displayName: name, photoURL });
      // Send real Firebase Email Verification
      await sendEmailVerification(cred.user);
    }

    const profile = await createOrUpdateUserProfile(cred.user, {
      name,
      displayName: name,
      profilePhoto: photoURL,
      photoURL,
      phoneNumber,
      isDriver,
      vehicle,
      role: 'user',
      rating: 0,
      accountStatus: 'active',
      emailVerified: false,
      phoneVerified: true,
      onboardingComplete: false
    });

    return { user: cred.user, profile };
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered. Please log in or use another email.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('The email address format is invalid.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('The password is too weak. Please use at least 6 characters.');
    }
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password provider is not enabled. In your Firebase Console, navigate to Authentication > Sign-in method and enable the "Email/Password" provider.');
    }
    throw err;
  }
}

/**
 * Resends real verification email to currently authenticated user.
 */
export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (err: any) {
    if (err.code === 'auth/too-many-requests') {
      throw new Error('Too many verification requests. Please wait a minute before requesting another email.');
    }
    throw err;
  }
}

/**
 * Checks if user's email has been verified by reloading Firebase User instance.
 * Updates Firestore profile when verified.
 */
export async function checkEmailVerification(user: User): Promise<boolean> {
  await user.reload();
  const verified = Boolean(auth.currentUser?.emailVerified);
  if (verified) {
    await updateDoc(doc(db, USER_COLLECTION, user.uid), {
      emailVerified: true,
      updatedAt: new Date().toISOString()
    });
  }
  return verified;
}

/**
 * Sends real Firebase SMS OTP by linking phone credential to CURRENT authenticated Firebase user UID.
 * This guarantees only ONE Firebase user UID per person.
 */
export async function sendPhoneVerificationCode(
  user: User,
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await linkWithPhoneNumber(user, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (err: any) {
    console.error('Phone link error:', err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Phone Authentication is not enabled. In your Firebase Console, navigate to Authentication > Sign-in method and enable the "Phone" provider.');
    }
    if (err.code === 'auth/invalid-phone-number') {
      throw new Error('The phone number format is invalid. Please include a valid country code (e.g. +91 9876543210).');
    }
    if (err.code === 'auth/credential-already-in-use') {
      throw new Error('This phone number is already linked to another account. Please use a unique phone number.');
    }
    if (err.code === 'auth/quota-exceeded' || err.code === 'auth/too-many-requests') {
      throw new Error('SMS quota or rate limit exceeded. Please wait a few minutes before requesting another code.');
    }
    if (err.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
    }
    throw err;
  }
}

/**
 * Confirms OTP code and completes 2-step verification for the current user.
 */
export async function confirmPhoneOtpAndComplete(
  confirmationResult: ConfirmationResult,
  code: string,
  phoneNumber: string
): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found. Please log in.');
  }

  try {
    await confirmationResult.confirm(code);
    await user.reload();


    // Mark phoneVerified and onboardingComplete in Firestore
    const updatedProfile = await createOrUpdateUserProfile(user, {
      phoneNumber: user.phoneNumber || phoneNumber,
      phoneVerified: true,
      emailVerified: user.emailVerified,
      onboardingComplete: Boolean(user.emailVerified)
    });

    return updatedProfile;
  } catch (err: any) {
    if (err.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid 6-digit SMS verification code. Please check your SMS and try again.');
    }
    if (err.code === 'auth/code-expired') {
      throw new Error('Verification code has expired. Please click "Resend SMS Code" to receive a new code.');
    }
    if (err.code === 'auth/credential-already-in-use') {
      throw new Error('This phone number is already linked to another account.');
    }
    throw err;
  }
}

/**
 * Password reset flow using Firebase's real password-reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      throw new Error('No registered user found with this email address.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('The email address format is invalid.');
    }
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Password reset requires Email/Password provider enabled in Firebase Console (Authentication > Sign-in method).');
    }
    throw err;
  }
}

/**
 * Normal Email + Password login.
 */
export async function loginWithEmail(email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await cred.user.reload();

    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await createOrUpdateUserProfile(cred.user);
    } else {
      // Sync live email verification if changed
      if (cred.user.emailVerified && !profile.emailVerified) {
        profile.emailVerified = true;
        profile.onboardingComplete = true;
        await updateDoc(doc(db, USER_COLLECTION, cred.user.uid), {
          emailVerified: true,
          onboardingComplete: profile.onboardingComplete,
          lastLoginAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, USER_COLLECTION, cred.user.uid), {
          lastLoginAt: new Date().toISOString()
        });
      }
    }
    return { user: cred.user, profile };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password provider is not enabled in your Firebase Console. Please enable "Email/Password" in Firebase Console (Authentication > Sign-in method).');
    }
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('The email address format is invalid.');
    }
    if (err.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    }
    throw err;
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return await createOrUpdateUserProfile(cred.user);
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in popup was closed. Please try again.');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Google sign-in popup was blocked by browser. Please allow popups or use email sign-in.');
    }
    throw new Error(error?.message || 'Google Sign-in failed. Please try email login.');
  }
}

export async function updateUserProfileDoc(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, USER_COLLECTION, uid);

  // Prevent unauthorized role or status elevation from client profile edits
  const safeUpdates = { ...updates };
  const currentUser = auth.currentUser;
  const isSuperAdmin = currentUser?.email === 'admin@routemate.com' || currentUser?.email === 'rishidubeyji68@gmail.com';

  if (!isSuperAdmin) {
    delete safeUpdates.role;
    delete safeUpdates.status;
    delete safeUpdates.isSuspended;
  }

  const cleanUpdates = cleanForFirestore({
    ...safeUpdates,
    updatedAt: serverTimestamp()
  });
  try {
    await updateDoc(userDocRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USER_COLLECTION}/${uid}`);
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}
