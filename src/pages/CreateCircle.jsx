import CreateActivity from '@/pages/CreateActivity';

/**
 * /host/create-circle renders the unified creation wizard directly with
 * hostType='circle' pre-selected, so both circle and experience creation share
 * the same page structure, step indicator, validation, and components.
 *
 * This renders instead of redirecting on purpose: the previous
 * navigate('/host/create', { replace: true }) shim erased the entry the user
 * came from, leaving Back with no valid destination — the blank screen.
 */
export default function CreateCircle() {
  return <CreateActivity hostType="circle" />;
}