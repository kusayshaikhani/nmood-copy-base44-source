import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * CreateCircle now redirects to the unified creation flow
 * (CreateActivity) with hostType='circle' pre-selected.
 * This ensures both circle and experience creation use the same
 * page structure, step indicator, validation, and components.
 */
export default function CreateCircle() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/host/create', { state: { hostType: 'circle' }, replace: true });
  }, [navigate]);
  return null;
}