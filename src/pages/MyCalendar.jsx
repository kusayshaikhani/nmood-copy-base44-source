import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import TodayCard from '@/components/calendar/TodayCard';
import AgendaView from '@/components/calendar/AgendaView';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import DayView from '@/components/calendar/DayView';
import CalendarEmptyState from '@/components/calendar/CalendarEmptyState';
import FreeTimeCard from '@/components/calendar/FreeTimeCard';
import ConflictWarning from '@/components/calendar/ConflictWarning';
import SocialView from '@/components/calendar/SocialView';
import SyncSheet from '@/components/calendar/SyncSheet';
import ReminderSheet from '@/components/calendar/ReminderSheet';
import { detectConflicts, findFreeSlots } from '@/lib/calendar-data';
import { useCalendarActivities } from '@/lib/calendar-live';
import { useLocalization } from '@/lib/i18n/useLocalization';

function matchesFilter(activity, filter) {
  switch (filter) {
    case 'all': return true;
    case 'hosting': return activity.status === 'hosting';
    case 'joined': return activity.status === 'joined';
    case 'pending': return activity.status === 'pending';
    case 'community': return !!activity.community;
    case 'circle': return !!activity.circle || activity.status === 'circle';
    case 'suggested': return activity.status === 'suggested';
    case 'completed': return activity.status === 'completed';
    default: return true;
  }
}

export default function MyCalendar() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [view, setView] = useState(() => localStorage.getItem('inmood_cal_view') || 'agenda');
  const [filter, setFilter] = useState('all');
  const [showSync, setShowSync] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderActivity, setReminderActivity] = useState(null);
  const calendarActivities = useCalendarActivities();

  useEffect(() => {
    localStorage.setItem('inmood_cal_view', view);
  }, [view]);

  const filtered = useMemo(() => calendarActivities.filter((a) => matchesFilter(a, filter)), [filter, calendarActivities]);
  const conflicts = useMemo(() => detectConflicts(calendarActivities), [calendarActivities]);
  const freeSlots = useMemo(() => findFreeSlots(calendarActivities), [calendarActivities]);
  const isEmpty = filtered.length === 0;

  const goToActivity = (a) => navigate('/experience/' + a.id);
  const goToDiscover = () => navigate('/explore');
  const goToHost = () => navigate('/host/create');

  const handleViewChange = (v) => setView(v);

  const openReminder = (a) => {
    setReminderActivity(a);
    setShowReminder(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CalendarHeader
        view={view}
        onViewChange={handleViewChange}
        onOpenSync={() => setShowSync(true)}
        onOpenReminders={() => { setReminderActivity(null); setShowReminder(true); }}
      />
      <CalendarFilters filter={filter} onFilterChange={setFilter} />

      {filter === 'all' && (
        <ConflictWarning conflicts={conflicts} onClick={(c) => c.activity && goToActivity(c.activity)} />
      )}

      {filter === 'all' && (
        <FreeTimeCard slots={freeSlots} onHost={goToHost} onDiscover={goToDiscover} />
      )}

      {filter === 'all' && (
        <SocialView activities={calendarActivities} onActivityClick={goToActivity} />
      )}

      <TodayCard activities={filtered} onDiscover={goToDiscover} onActivityClick={goToActivity} />

      {isEmpty ? (
        <CalendarEmptyState onDiscover={goToDiscover} />
      ) : (
        <>
          {view === 'day' && <DayView activities={filtered} onActivityClick={goToActivity} />}
          {view === 'agenda' && <AgendaView activities={filtered} onActivityClick={goToActivity} />}
          {view === 'week' && <WeekView activities={filtered} onActivityClick={goToActivity} />}
          {view === 'month' && <MonthView activities={filtered} onActivityClick={goToActivity} />}
        </>
      )}

      <SyncSheet open={showSync} onOpenChange={setShowSync} />
      <ReminderSheet open={showReminder} onOpenChange={setShowReminder} activity={reminderActivity} />
    </div>
  );
}