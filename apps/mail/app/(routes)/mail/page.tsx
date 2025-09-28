import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function clientLoader() {
  return Response.redirect(`${import.meta.env.VITE_PUBLIC_APP_URL}/mail/inbox`);
}

// Default component to handle the redirect client-side as fallback
export default function MailRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/mail/inbox', { replace: true });
  }, [navigate]);

  return <div>Redirecting to inbox...</div>;
}
