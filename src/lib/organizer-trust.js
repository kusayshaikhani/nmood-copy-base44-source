import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

/**
 * PB-002 — Real organizer trust calculated from live data.
 *
 * Metrics (all from real entity records, never fabricated):
 *  - experiencesHosted   — Experience records where host_user_id matches
 *  - completedExperiences — subset with status === 'completed'
 *  - completionRate       — completed / non-cancelled * 100
 *  - averageRating        — mean of ExperienceRating records linked to hosted experiences
 *  - ratingCount          — number of ratings behind the average
 *  - reportsReceived      — SafetyReport records targeting this host
 *  - verified             — Member.phone_verified
 *  - memberSince          — Member.created_date formatted as 'MMM YYYY'
 *
 * Returns { trust, loading }. trust is null when insufficient data
 * (0 hosted experiences) — callers must show "Not enough activity yet."
 */
export function useOrganizerTrust(hostUserId) {
  const [trust, setTrust] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hostUserId) {
      setTrust(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    async function compute() {
      try {
        // 1 — All experiences hosted by this user
        const hosted = await base44.entities.Experience.filter({ host_user_id: hostUserId });

        if (!active) return;

        // Insufficient data: no hosting activity yet
        if (!hosted || hosted.length === 0) {
          setTrust(null);
          setLoading(false);
          return;
        }

        const experiencesHosted = hosted.length;
        const completedExperiences = hosted.filter((e) => e.status === 'completed').length;
        const nonCancelled = hosted.filter((e) => e.status !== 'cancelled').length;
        const completionRate = nonCancelled > 0
          ? Math.round((completedExperiences / nonCancelled) * 100)
          : 0;

        // 2 — Ratings for these experiences
        const expIds = hosted.map((e) => String(e.id));
        let averageRating = null;
        let ratingCount = 0;
        try {
          const allRatings = await base44.entities.ExperienceRating.list('-created_date', 200);
          const matched = (allRatings || []).filter((r) => expIds.includes(String(r.experience_id)));
          ratingCount = matched.length;
          if (ratingCount > 0) {
            const sum = matched.reduce((s, r) => s + (Number(r.rating) || 0), 0);
            averageRating = Math.round((sum / ratingCount) * 10) / 10;
          }
        } catch {
          /* ratings table may be empty or unavailable */
        }

        // 3 — Reports against this host
        let reportsReceived = 0;
        try {
          const reports = await base44.entities.SafetyReport.filter({
            target_type: 'host',
            target_id: hostUserId,
          });
          reportsReceived = (reports || []).length;
        } catch {
          /* reports table may be empty or unavailable */
        }

        // 4 — Member record for verification status + member since
        let verified = false;
        let memberSince = null;
        try {
          const members = await base44.entities.Member.filter({ created_by_id: hostUserId });
          const member = members?.[0];
          if (member) {
            verified = member.phone_verified === true;
            if (member.created_date) {
              memberSince = moment(member.created_date).format('MMM YYYY');
            }
          }
        } catch {
          /* member record may not exist yet */
        }

        if (!active) return;

        setTrust({
          experiencesHosted,
          completedExperiences,
          completionRate,
          averageRating,
          ratingCount,
          reportsReceived,
          verified,
          memberSince,
        });
        setLoading(false);
      } catch {
        if (active) {
          setTrust(null);
          setLoading(false);
        }
      }
    }

    compute();
    return () => {
      active = false;
    };
  }, [hostUserId]);

  return { trust, loading };
}