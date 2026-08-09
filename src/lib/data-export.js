// LC-002A Part 1 — Data Export.
// Compiles the member's data across entities into a single JSON object
// and triggers a browser download.
//
// LC-002A: Queries use ALL user-related fields per entity — not just
// created_by_id. For each entity, we query every field that can reference
// the user (owner, sender, receiver, participant, attendee, host, viewer,
// profile owner, blocked member, etc.) and dedupe by record id.

import { base44 } from '@/api/base44Client';

async function safeFilter(entityName, query) {
  try {
    return await base44.entities[entityName].filter(query);
  } catch {
    return [];
  }
}

// Query an entity by multiple user-related fields (OR semantics) and
// dedupe results by record id. Includes created_by_id as a fallback
// so records created by the user are always captured.
async function safeFilterMulti(entityName, fields, userId) {
  const queries = fields.map((f) => ({ [f]: userId }));
  const batches = await Promise.all(queries.map((q) => safeFilter(entityName, q)));
  const seen = new Set();
  const merged = [];
  for (const batch of batches) {
    for (const item of batch) {
      const key = item.id || JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
  }
  return merged;
}

export async function compileMemberData(member, user) {
  const userId = user?.id || member?.created_by_id;

  // Entities with explicit user-ID fields — query by ALL relevant fields.
  const [
    palConnections,
    palRequests,
    privateConversations,
    privateMessages,
    experiences,
    memberships,
    profileViews,
    blockedMembers,
  ] = await Promise.all([
    safeFilterMulti('PalConnection', ['user_id', 'pal_user_id', 'created_by_id'], userId),
    safeFilterMulti('PalRequest', ['sender_user_id', 'receiver_user_id', 'created_by_id'], userId),
    safeFilterMulti('PrivateConversation', ['participant_a_id', 'participant_b_id', 'created_by_id'], userId),
    safeFilterMulti('PrivateMessage', ['sender_id', 'receiver_id', 'created_by_id'], userId),
    safeFilterMulti('Experience', ['host_user_id', 'created_by_id'], userId),
    safeFilterMulti('Membership', ['user_id', 'created_by_id'], userId),
    safeFilterMulti('ProfileView', ['profile_owner_id', 'viewer_id', 'created_by_id'], userId),
    safeFilterMulti('BlockedMember', ['blocked_user_id', 'created_by_id'], userId),
  ]);

  // Entities with no explicit user-ID field — created_by_id is the only
  // available query (these store member_name/sender_name, not user IDs).
  const [
    attendance,
    ratings,
    circleMemberships,
    circles,
    chatMessages,
    communityMessages,
    circleChatMessages,
    safetyReports,
    supportTickets,
    invitations,
    interestPolls,
  ] = await Promise.all([
    safeFilter('Attendance', { created_by_id: userId }),
    safeFilter('ExperienceRating', { created_by_id: userId }),
    safeFilter('CircleMembership', { created_by_id: userId }),
    safeFilter('Circle', { created_by_id: userId }),
    safeFilter('ChatMessage', { created_by_id: userId }),
    safeFilter('CommunityMessage', { created_by_id: userId }),
    safeFilter('CircleChatMessage', { created_by_id: userId }),
    safeFilter('SafetyReport', { created_by_id: userId }),
    safeFilter('SupportTicket', { created_by_id: userId }),
    safeFilter('Invitation', { created_by_id: userId }),
    safeFilter('InterestPoll', { created_by_id: userId }),
  ]);

  return {
    export_metadata: {
      exported_at: new Date().toISOString(),
      app_version: '1.0.0',
      format: 'JSON',
      note: 'This file contains all personal data Nmood holds about you, per GDPR Article 20 (Data Portability) and UAE PDPL Article 19.',
    },
    profile: {
      display_name: member?.display_name,
      first_name: member?.first_name,
      last_name: member?.last_name,
      email: member?.email || user?.email,
      phone: member?.phone,
      date_of_birth: member?.date_of_birth,
      gender: member?.gender,
      country: member?.country,
      city: member?.city,
      languages: member?.languages,
      interests: member?.interests,
      lifestyle: member?.lifestyle,
      bio: member?.bio,
      photo_url: member?.photo_url,
      photo_gallery: member?.photo_gallery,
      created_date: member?.created_date,
    },
    privacy_settings: {
      profile_visibility: member?.profile_visibility,
      who_can_message: member?.who_can_message,
      show_online_status: member?.show_online_status,
      show_age: member?.show_age,
      show_distance: member?.show_distance,
      show_last_seen: member?.show_last_seen,
      personalized_recommendations: member?.personalized_recommendations,
      analytics_consent: member?.analytics_consent,
      location_enabled: member?.location_enabled,
      profile_view_visibility: member?.profile_view_visibility,
    },
    trust_information: {
      phone_verified: member?.phone_verified,
      admin_status: member?.admin_status,
    },
    membership: memberships,
    preferences: {
      notifications_enabled: member?.notifications_enabled,
      notif_email: member?.notif_email,
      notif_circle: member?.notif_circle,
    },
    connections: palConnections,
    pal_requests: palRequests,
    private_conversations: privateConversations,
    private_messages: privateMessages,
    experiences: experiences,
    attendance: attendance,
    experience_ratings: ratings,
    experience_chat_messages: chatMessages,
    circles: circles,
    circle_memberships: circleMemberships,
    circle_chat_messages: circleChatMessages,
    community_messages: communityMessages,
    profile_views: profileViews,
    blocked_members: blockedMembers,
    safety_reports: safetyReports,
    support_tickets: supportTickets,
    invitations: invitations,
    interest_polls: interestPolls,
  };
}

export function downloadDataExport(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().split('T')[0];
  a.download = `nmood-data-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}