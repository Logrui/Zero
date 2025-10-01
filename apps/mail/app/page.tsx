import FastHomeContent from '@/components/home/FastHomeContent';
import { useSession } from '@/lib/auth-client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Home() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have a valid session
    if (session?.user?.id) {
      navigate('/mail/inbox');
    }
  }, [session, navigate]);

  return <FastHomeContent />;
}
