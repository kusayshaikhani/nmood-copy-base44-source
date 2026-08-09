import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban } from 'lucide-react';
import BlockMemberSheet from './BlockMemberSheet';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function BlockedMembersSection() {
  const { t } = useLocalization();
  const { blocked, unblock } = useSafety();
  const [showBlockSheet, setShowBlockSheet] = useState(false);

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">{t('safety.block.members')}</h2>
      <Card className="p-3 mb-3 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Blocked members can't message you, send invitations, become your Pal, or view your profile — and they disappear from your discovery and search.
        </p>
      </Card>
      {blocked.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
            <Ban className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {blocked.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3.5">
              <Avatar className="w-9 h-9">
                {member.blocked_avatar && <AvatarImage src={member.blocked_avatar} alt={member.blocked_name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(member.blocked_name || '?').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium">{member.blocked_name || 'Unknown'}</span>
              <Button variant="outline" size="sm" onClick={() => unblock(member.blocked_user_id)}>Unblock</Button>
            </div>
          ))}
        </Card>
      )}

      <Button variant="outline" className="w-full mt-3 gap-2" onClick={() => setShowBlockSheet(true)}>
        <Ban className="w-4 h-4" />{t('safety.block.title')}</Button>

      <BlockMemberSheet open={showBlockSheet} onOpenChange={setShowBlockSheet} />
    </section>
  );
}