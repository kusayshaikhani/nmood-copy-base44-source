export function androidEmailValidation(platform,email,password) {
 if(platform!=='android') return null;
 if(!email.trim()) return 'auth.error_email_required';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'auth.error_invalid_email_password';
 if(!password) return 'auth.error_password_required';
 return null;
}
