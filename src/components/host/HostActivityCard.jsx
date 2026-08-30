import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, MoreVertical, MapPin, Clock, Globe, Lock, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import HostActivityActions from './HostActivityActions';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isUnlimitedCapacity } from '@/lib/capacity';

const statusStyles = {
  upcoming: 'bg-success/10 text-success',
  live: 'bg-success text-success-foreground',
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
};

const visibilityMap = {
  public: { icon: Globe, label: 'Public' },
  approval: { icon: UserCheck, label: 'Approval' },
  invite: { icon: Lock, label: 'Invite Only' },
};

export default function HostActivityCard({ activity }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);

  const isLive = activity.status === 'live';
  const isDraft = activity.status === 'draft';
  const statusLabel = activity.status.charAt(0).toUpperCase() + activity.status.slice(1);
  const fillPercent = isUnlimitedCapacity(activity.capacity)
    ? null
    : Math.min(100, Math.round((activity.joinedMembers / activity.capacity) * 100));
  const vis = visibilityMap[activity.visibility] || visibilityMap.public;
  const VisIcon = vis.icon;

  return (
    <>
      <Card className="overflow-hidden">
        {isLive && (
          <div className="bg-success text-success-foreground px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold tracking-wide">{t('hosting.activity.live_now')}</span>
            </div>
            <span className="text-xs font-medium">{activity.timeRemaining}</span>
          </div>
        )}

        <div className="p-3 flex gap-3">
          <img
            src={activity.coverImage}
            alt=""
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-primary capitalize">{activity.type}</span>
              <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + statusStyles[activity.status]}>
                {statusLabel}
              </span>
            </div>
            <h3 className="font-semibold text-sm truncate mb-1.5">{activity.title}</h3>
            <div className="space-y-0.5">
              {!isDraft && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{activity.date}{activity.time && ' · ' + activity.time}</span>
                </p>
              )}
              {activity.location !== 'Not set' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{activity.location}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <VisIcon className="w-3 h-3 flex-shrink-0" />
                {vis.label}
              </p>
            </div>
          </div>
        </div>

        {!isDraft && (
          <div className="px-3 pb-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs text-muted-foreground">
                {isLive ? activity.currentParticipants + ' live' : activity.joinedMembers + ' joined'}
                {fillPercent === null ? ' · ' + t('hosting.capacity.unlimited') : ' / ' + activity.capacity}
              </span>
              {activity.pendingRequests > 0 && (
                <span className="text-xs text-warning font-medium">
                  {activity.pendingRequests} pending
                </span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: (fillPercent ?? 0) + '%' }} />
            </div>
          </div>
        )}

        <div className="flex items-center border-t border-border">
          <ActionBtn icon={Eye} label={t('hosting.success.view')} onClick={() => navigate('/experience/' + activity.id)} />
          <Divider />
          <ActionBtn icon={Pencil} label={t('hosting.activity.edit')} />
          <Divider />
          <ActionBtn icon={MoreVertical} label={t('hosting.activity.more')} onClick={() => setActionsOpen(true)} />
        </div>
      </Card>

      <HostActivityActions
        activity={activity}
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />
    </>
  );
}

function ActionBtn({ icon: Icon, label, onClick, tint }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium hover:bg-muted/40 rounded-lg transition-default"
    >
      <Icon className={'w-3.5 h-3.5 ' + (tint || '')} />
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border" />;
}