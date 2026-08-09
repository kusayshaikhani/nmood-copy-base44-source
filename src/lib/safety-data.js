import { MapPin, UserCheck, Heart, Flag, Calendar, Users, User, MessageSquare, Shield, Eye, Bell, Mail, HelpCircle, Bug, BookOpen, Crown } from 'lucide-react';

export const safetyTips = [
  { icon: MapPin, title: 'Meet in public places', description: 'Choose well-lit, public locations for your first meetups with new connections.' },
  { icon: UserCheck, title: "Tell someone where you're going", description: 'Share your plans and location with a trusted friend or family member.' },
  { icon: Heart, title: 'Trust your instincts', description: "If something feels off, it's okay to leave or cancel. Your safety comes first." },
  { icon: Flag, title: 'Report inappropriate behaviour', description: 'Help keep the community safe by reporting any concerning behaviour.' },
];

export const reportTargets = [
  { id: 'experience', label: 'Experience', icon: Calendar },
  { id: 'organizer', label: 'Organizer', icon: Crown },
  { id: 'member', label: 'Member', icon: User },
  { id: 'message', label: 'Message', icon: MessageSquare },
];

export const reportReasons = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'fake_profile', label: 'Fake Profile' },
  { id: 'inappropriate', label: 'Inappropriate Behaviour' },
  { id: 'safety_concern', label: 'Safety Concern' },
  { id: 'other', label: 'Other' },
];

// LCB-004C — Synchronized with FO-007 §2 + LRP-D §6. Single authoritative rule set.
export const communityGuidelines = [
  { icon: Heart, title: 'Be human. Be honest. Be kind.', description: 'Lead with empathy, compassion, and honesty in every connection.' },
  { icon: Users, title: 'Respect everyone, equally.', description: 'Treat every member with dignity, regardless of nationality, culture, religion, or language.' },
  { icon: Shield, title: 'No hate. No harassment. No exploitation.', description: 'Zero tolerance for hate, harassment, racism, discrimination, violence, extremism, fraud, and exploitation.' },
  { icon: Flag, title: 'Report harm. Help us protect the community.', description: 'Use the in-app Report feature to flag any violation you witness.' },
];

export const privacyShortcuts = [
  { id: 'profile_visibility', label: 'Profile visibility', icon: Eye, value: 'Connections only' },
  { id: 'location_sharing', label: 'Location sharing', icon: MapPin, value: 'Off' },
  { id: 'online_status', label: 'Online status', icon: Bell, value: 'Visible' },
  { id: 'invitation_settings', label: 'Invitation settings', icon: Mail, value: 'Connections only' },
  { id: 'who_can_message', label: 'Message permissions', icon: MessageSquare, value: 'Connections only' },
];

export const helpSupport = [
  { id: 'contact', label: 'Contact Support', icon: Mail, route: '/help' },
  { id: 'feedback', label: 'Submit Feedback', icon: MessageSquare, route: '/help' },
  { id: 'appeal', label: 'Appeal Moderation Decision', icon: Shield, route: '/help' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, route: '/help' },
  { id: 'bug', label: 'Report a Bug', icon: Bug, route: '/help' },
  { id: 'safety_guide', label: 'Safety Guide', icon: BookOpen, route: '/about' },
];

// PB-002: organizerTrust removed — trust is now calculated from real data via
// useOrganizerTrust() in src/lib/organizer-trust.js. Never fabricate metrics.

export const emergencyContacts = [
  { label: 'UAE Emergency (Police)', number: '999' },
  { label: 'Ambulance', number: '998' },
  { label: 'Civil Defence (Fire)', number: '997' },
];

export const safetyAdvice = [
  { title: 'Meet in Public', description: 'Always meet in well-lit, public locations for first-time meetups.' },
  { title: 'Share Your Plans', description: 'Tell a trusted friend where you are going and who you are meeting.' },
  { title: 'Trust Your Instincts', description: 'If something feels wrong, leave immediately. Your safety comes first.' },
  { title: 'Stay Sober', description: 'Keep a clear head during meetups with new connections.' },
];