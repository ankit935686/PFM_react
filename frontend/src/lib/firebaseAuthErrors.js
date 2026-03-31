const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled in Firebase Authentication.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/email-already-in-use': 'This email is already registered. Please login instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/operation-not-allowed': 'Email/Password sign-in is disabled in Firebase project settings.',
};

export const getFirebaseAuthErrorMessage = (error) => {
  if (!error?.code) {
    return 'Authentication failed. Please try again.';
  }

  return AUTH_ERROR_MESSAGES[error.code] || `Authentication failed (${error.code}).`;
};
