const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled in Firebase Authentication.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/email-already-in-use': 'This email is already registered. Please login instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/operation-not-allowed': 'Email/Password sign-in is disabled in Firebase project settings.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before completing. Please try again.',
  'auth/popup-blocked': 'Popup was blocked by the browser. Please allow popups and try again.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled. Please try again.',
};

export const getFirebaseAuthErrorMessage = (error) => {
  if (!error?.code) {
    return 'Authentication failed. Please try again.';
  }

  return AUTH_ERROR_MESSAGES[error.code] || `Authentication failed (${error.code}).`;
};
