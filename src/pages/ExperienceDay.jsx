import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { useExperiences } from '@/lib/discover-store';
import { getExperiencePhase, getCountdown, PHASES } from '@/lib/experience-day-engine';
import DayHeader from '@/components/experience-day/DayHeader';
import PhaseTimeline from '@/components/experience-day/PhaseTimeline';
import DayInfoCard from '@/components/experience-day/DayInfoCard';
import GettingReadyActions from '@/components/experience-day/GettingReadyActions';
import TimeToLeave from '@/components/experience-day/TimeToLeave';
import LiveActions from '@/components/experience-day/LiveActions';
import AfterExperience from '@/components/experience-day/AfterExperience';
import FollowUp from '@/components/experience-day/FollowUp';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';

export default function ExperienceDay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [now, setNow] = useState(moment());
  const { t } = useLocalization();
  const { experiences: allExperiences } = useExperiences();

  const experience = allExperiences.find(e => e.id === id);

  useEffect(() => {
    base44.entities.Attendance.filter({ experience_id: id })
      .then(records => {
        if (records.length === 0 || records[0].status !== 'going') {
          navigate(`/experience/${id}`, { replace: true });
          return;
        }
        setAttendance(records[0]);
        setArrived(records[0].arrived || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const interval = setInterval(() => setNow(moment()), 60000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-muted-foreground mb-4">{t('experiences.day.not_found')}</p>
        <button onClick={() => navigate('/explore')} className="text-primary font-medium">{t('experiences.chat.discover')}</button>
      </div>
    );
  }

  const phase = getExperiencePhase(experience, now);
  const countdown = getCountdown(experience, now);

  const handleImHere = async () => {
    try {
      const resp = await base44.functions.invoke('authorizationGate', {
        action: 'markArrived',
        experienceId: id,
      });
      const res = resp?.data || resp;
      if (!res?.ok) { toast(res?.message || 'Could not mark as arrived.'); return; }
      setArrived(true);
    } catch { toast('Could not mark as arrived.'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <DayHeader experience={experience} phase={phase} countdown={countdown} onBack={() => navigate(`/experience/${id}`)} />
      <PhaseTimeline experience={experience} now={now} />

      {(phase === PHASES.FAR || phase === PHASES.TOMORROW) && <DayInfoCard experience={experience} />}
      {phase === PHASES.GETTING_READY && <GettingReadyActions experience={experience} />}
      {phase === PHASES.TIME_TO_LEAVE && <TimeToLeave experience={experience} arrived={arrived} onArrive={handleImHere} />}
      {phase === PHASES.LIVE && <LiveActions experience={experience} arrived={arrived} onArrive={handleImHere} />}
      {phase === PHASES.COMPLETED && <AfterExperience experience={experience} />}
      {phase === PHASES.FOLLOW_UP && <FollowUp experience={experience} />}
    </div>
  );
}