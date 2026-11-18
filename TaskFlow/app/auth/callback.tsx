import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// On mobile, openAuthSessionAsync handles the sign-in redirect.
// this route only exists so expo-router doesn't show "Unmatched Route"
// if the deep link also reaches the app -> sends the user home.
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, []);
  return null;
}