import { Users, UserCheck, UserPlus, Calendar, Crown, Flag, BadgeCheck, CalendarCheck, Heart, Circle, X, Mail, Clock, CheckCircle, MessageSquare } from 'lucide-react';

export const adminMembers = [
  { id: 1, member_id: 'M-0001', name: 'Sarah Kim', email: 'sarah.kim@email.com', tier: 'Premium', joined: '2026-06-15', status: 'active', country: 'South Korea', city: 'Seoul' },
  { id: 2, member_id: 'M-0002', name: 'James Miller', email: 'j.miller@email.com', tier: 'Standard', joined: '2026-06-20', status: 'active', country: 'United States', city: 'New York' },
  { id: 3, member_id: 'M-0003', name: 'Aisha Patel', email: 'aisha.p@email.com', tier: 'VIP', joined: '2026-05-10', status: 'active', country: 'India', city: 'Mumbai' },
  { id: 4, member_id: 'M-0004', name: 'Liam Chen', email: 'liam.c@email.com', tier: 'Basic', joined: '2026-07-01', status: 'suspended', country: 'China', city: 'Shanghai' },
  { id: 5, member_id: 'M-0005', name: 'Maria Oliveira', email: 'm.oliveira@email.com', tier: 'Premium', joined: '2026-06-28', status: 'active', country: 'Brazil', city: 'São Paulo' },
  { id: 6, member_id: 'M-0006', name: 'Noah Schmidt', email: 'noah.s@email.com', tier: 'Standard', joined: '2026-07-03', status: 'active', country: 'Germany', city: 'Berlin' },
  { id: 7, member_id: 'M-0007', name: 'Emma Wilson', email: 'emma.w@email.com', tier: 'Basic', joined: '2026-07-04', status: 'pending', country: 'Australia', city: 'Sydney' },
  { id: 8, member_id: 'M-0008', name: 'Yuki Tanaka', email: 'yuki.t@email.com', tier: 'VIP', joined: '2026-04-12', status: 'active', country: 'Japan', city: 'Tokyo' },
  { id: 9, member_id: 'M-0009', name: 'Alex Brown', email: 'alex.b@email.com', tier: 'Basic', joined: '2026-06-10', status: 'banned', country: 'Canada', city: 'Toronto' },
];

export const adminActivities = [
  { id: 1, title: 'Sunset Yoga Session', host: 'Sarah Kim', date: '2026-07-10', participants: 24, status: 'published', category: 'Wellness' },
  { id: 2, title: 'Art Walk Downtown', host: 'James Miller', date: '2026-07-12', participants: 18, status: 'published', category: 'Arts' },
  { id: 3, title: 'Wine Tasting Night', host: 'Aisha Patel', date: '2026-07-15', participants: 32, status: 'published', category: 'Social' },
  { id: 4, title: 'Live Music Circle', host: 'Liam Chen', date: '2026-07-08', participants: 45, status: 'draft', category: 'Music' },
  { id: 5, title: 'Book Club Meeting', host: 'Maria Oliveira', date: '2026-07-20', participants: 12, status: 'published', category: 'Learning' },
  { id: 6, title: 'Morning Hike Trail', host: 'Noah Schmidt', date: '2026-07-14', participants: 28, status: 'published', category: 'Outdoor' },
  { id: 7, title: 'Cooking Masterclass', host: 'Yuki Tanaka', date: '2026-07-18', participants: 16, status: 'cancelled', category: 'Food' },
  { id: 8, title: 'Photography Walk', host: 'Emma Wilson', date: '2026-07-22', participants: 0, status: 'archived', category: 'Arts' },
];

export const adminCircles = [
  { id: 1, name: 'Mindful Mornings', members: 142, host: 'Sarah Kim', created: '2026-06-01', status: 'active' },
  { id: 2, name: 'City Explorers', members: 89, host: 'James Miller', created: '2026-06-10', status: 'active' },
  { id: 3, name: 'Creative Souls', members: 215, host: 'Aisha Patel', created: '2026-05-20', status: 'active' },
  { id: 4, name: 'Evennergy', members: 34, host: 'Liam Chen', created: '2026-07-02', status: 'pending' },
  { id: 5, name: 'Foodie Friends', members: 178, host: 'Maria Oliveira', created: '2026-06-15', status: 'active' },
  { id: 6, name: 'Trail Blazers', members: 67, host: 'Noah Schmidt', created: '2026-06-25', status: 'inactive' },
];

export const adminHosts = [
  { id: 1, name: 'Sarah Kim', activities: 5, completion_rate: 95, cancellation_rate: 5, rating: '4.9', status: 'verified', joined: '2026-03-15' },
  { id: 2, name: 'James Miller', activities: 3, completion_rate: 90, cancellation_rate: 10, rating: '4.7', status: 'verified', joined: '2026-04-01' },
  { id: 3, name: 'Aisha Patel', activities: 7, completion_rate: 100, cancellation_rate: 0, rating: '4.8', status: 'verified', joined: '2026-02-20' },
  { id: 4, name: 'Liam Chen', activities: 2, completion_rate: 50, cancellation_rate: 50, rating: '4.6', status: 'pending', joined: '2026-06-28' },
  { id: 5, name: 'Maria Oliveira', activities: 4, completion_rate: 92, cancellation_rate: 8, rating: '5.0', status: 'verified', joined: '2026-05-05' },
  { id: 6, name: 'Noah Schmidt', activities: 1, completion_rate: 100, cancellation_rate: 0, rating: '4.5', status: 'pending', joined: '2026-07-01' },
  { id: 7, name: 'Yuki Tanaka', activities: 9, completion_rate: 97, cancellation_rate: 3, rating: '4.9', status: 'verified', joined: '2026-01-10' },
  { id: 8, name: 'Alex Brown', activities: 2, completion_rate: 40, cancellation_rate: 60, rating: '3.2', status: 'suspended', joined: '2026-06-10' },
];

export const adminReports = [
  { id: 'RPT-001', reporter: 'Sarah Kim', target: 'Liam Chen', experience: 'Sunset Yoga Session', reason: 'Harassment', evidence: 2, date: '2026-07-04', priority: 'high', status: 'new' },
  { id: 'RPT-002', reporter: 'James Miller', target: 'Unknown User', experience: 'Art Walk Downtown', reason: 'Spam', evidence: 0, date: '2026-07-03', priority: 'low', status: 'reviewing' },
  { id: 'RPT-003', reporter: 'Aisha Patel', target: 'Photo #4821', experience: 'Wine Tasting Night', reason: 'Inappropriate Behaviour', evidence: 3, date: '2026-07-03', priority: 'medium', status: 'new' },
  { id: 'RPT-004', reporter: 'Liam Chen', target: 'Emma Wilson', experience: 'Live Music Circle', reason: 'Fake Profile', evidence: 1, date: '2026-07-02', priority: 'high', status: 'resolved' },
  { id: 'RPT-005', reporter: 'Maria Oliveira', target: 'Comment #891', experience: 'Book Club Meeting', reason: 'Safety Concern', evidence: 2, date: '2026-07-01', priority: 'medium', status: 'resolved' },
  { id: 'RPT-006', reporter: 'Noah Schmidt', target: 'Circle #23', experience: 'Morning Hike Trail', reason: 'Other', evidence: 0, date: '2026-06-30', priority: 'low', status: 'closed' },
  { id: 'RPT-007', reporter: 'Emma Wilson', target: 'Alex Brown', experience: 'Cooking Masterclass', reason: 'Safety Concern', evidence: 4, date: '2026-07-04', priority: 'high', status: 'new' },
];

export const adminContent = [
  { id: 1, title: 'Community Guidelines v3', type: 'Policy', author: 'Admin', date: '2026-07-01', status: 'published' },
  { id: 2, title: 'Summer Campaign Banner', type: 'Image', author: 'Admin', date: '2026-06-28', status: 'published' },
  { id: 3, title: 'Onboarding Video', type: 'Video', author: 'Admin', date: '2026-06-20', status: 'published' },
  { id: 4, title: 'Privacy Policy Update', type: 'Policy', author: 'Admin', date: '2026-07-03', status: 'draft' },
  { id: 5, title: 'Featured Collection', type: 'Curated', author: 'Admin', date: '2026-07-02', status: 'published' },
  { id: 6, title: 'Help Center Articles', type: 'Article', author: 'Admin', date: '2026-06-15', status: 'published' },
];

export const adminAuditLogs = [
  { id: 1, action: 'Member Suspended', user: 'admin@inmood.com', target: 'Liam Chen', reason: 'Harassment violation', timestamp: '2026-07-04 10:32', ip: '203.0.113.42' },
  { id: 2, action: 'Report Resolved', user: 'admin@inmood.com', target: 'RPT-004', reason: 'Fake profile confirmed', timestamp: '2026-07-03 18:15', ip: '203.0.113.42' },
  { id: 3, action: 'Host Verified', user: 'admin@inmood.com', target: 'Sarah Kim', reason: 'Identity verified', timestamp: '2026-07-03 14:22', ip: '203.0.113.42' },
  { id: 4, action: 'Content Published', user: 'admin@inmood.com', target: 'Community Guidelines v3', reason: 'Scheduled release', timestamp: '2026-07-01 09:00', ip: '203.0.113.42' },
  { id: 5, action: 'Notification Sent', user: 'admin@inmood.com', target: 'New Feature: Circles 2.0', reason: 'Product announcement', timestamp: '2026-07-03 12:00', ip: '203.0.113.42' },
  { id: 6, action: 'Feature Flag Toggled', user: 'admin@inmood.com', target: 'advanced_filters', reason: 'QA approval', timestamp: '2026-06-30 16:45', ip: '203.0.113.42' },
  { id: 7, action: 'Member Role Changed', user: 'admin@inmood.com', target: 'Aisha Patel → VIP', reason: 'Tier upgrade request', timestamp: '2026-06-28 11:30', ip: '203.0.113.42' },
];

export const memberGrowthData = [
  { month: 'Jan', members: 8200 },
  { month: 'Feb', members: 9100 },
  { month: 'Mar', members: 9800 },
  { month: 'Apr', members: 10500 },
  { month: 'May', members: 11200 },
  { month: 'Jun', members: 12100 },
  { month: 'Jul', members: 12847 },
];

export const categoryData = [
  { category: 'Wellness', count: 680 },
  { category: 'Social', count: 540 },
  { category: 'Arts', count: 420 },
  { category: 'Outdoor', count: 380 },
  { category: 'Music', count: 310 },
  { category: 'Food', count: 260 },
];

export const adminRoles = [
  { role: 'Super Admin', count: 2, permissions: ['Full access to all analytics', 'Manage admin accounts', 'Export all data', 'Configure dashboard', 'Delete content'] },
  { role: 'Operations Manager', count: 4, permissions: ['View all analytics', 'Export CSV and Excel', 'Manage filters', 'View member insights', 'View experience insights'] },
  { role: 'Read Only Analyst', count: 12, permissions: ['View analytics dashboard', 'No export rights', 'No configuration', 'Read-only access to all charts'] },
];

export const platformOverviewKpis = [
  { id: 'total_members', label: 'Total Members', value: '12,847', icon: Users, trend: '8.2%', trendUp: true, color: 'primary' },
  { id: 'dau', label: 'Daily Active', value: '3,847', icon: UserCheck, trend: '4.2%', trendUp: true, color: 'success' },
  { id: 'wau', label: 'Weekly Active', value: '8,392', icon: Users, trend: '5.1%', trendUp: true, color: 'info' },
  { id: 'mau', label: 'Monthly Active', value: '10,215', icon: Users, trend: '3.8%', trendUp: true, color: 'primary' },
  { id: 'new_registrations', label: 'New Registrations', value: '147', icon: UserPlus, trend: '12.3%', trendUp: true, color: 'info' },
  { id: 'verified_members', label: 'Verified Members', value: '9,821', icon: BadgeCheck, trend: '6.1%', trendUp: true, color: 'success' },
  { id: 'active_organizers', label: 'Active Organizers', value: '542', icon: Crown, trend: '4.7%', trendUp: true, color: 'warning' },
  { id: 'published_experiences', label: 'Published Experiences', value: '3,218', icon: Calendar, trend: '3.4%', trendUp: true, color: 'primary' },
  { id: 'completed_experiences', label: 'Completed Experiences', value: '2,847', icon: CalendarCheck, trend: '2.1%', trendUp: true, color: 'success' },
  { id: 'active_circles', label: 'Active Circles', value: '89', icon: Circle, trend: '2.1%', trendUp: false, color: 'warning' },
];

export const memberInsightKpis = [
  { id: 'avg_experiences', label: 'Avg Experiences / Member', value: '4.2', icon: Calendar, trend: '0.3', trendUp: true, color: 'primary' },
  { id: 'avg_pals', label: 'Avg Pals / Member', value: '12.8', icon: Heart, trend: '1.2', trendUp: true, color: 'success' },
  { id: 'returning_members', label: 'Returning Members', value: '6,421', icon: UserCheck, trend: '5.4%', trendUp: true, color: 'info' },
  { id: 'new_members', label: 'New Members', value: '2,394', icon: UserPlus, trend: '8.7%', trendUp: true, color: 'warning' },
];

export const mostActiveCities = [
  { city: 'Dubai', members: 1842, percentage: 14.3 },
  { city: 'London', members: 1203, percentage: 9.4 },
  { city: 'Tokyo', members: 987, percentage: 7.7 },
  { city: 'Seoul', members: 845, percentage: 6.6 },
  { city: 'Mumbai', members: 712, percentage: 5.5 },
];

export const mostActiveAgeGroups = [
  { group: '25-34', members: 4218, percentage: 32.8 },
  { group: '35-44', members: 3192, percentage: 24.8 },
  { group: '18-24', members: 2513, percentage: 19.6 },
  { group: '45-54', members: 1803, percentage: 14.0 },
  { group: '55+', members: 1121, percentage: 8.7 },
];

export const newVsReturningData = [
  { name: 'New', value: 2394, fill: 'hsl(var(--info))' },
  { name: 'Returning', value: 6421, fill: 'hsl(var(--primary))' },
];

export const experienceInsightKpis = [
  { id: 'avg_attendance', label: 'Average Attendance', value: '87%', icon: Users, trend: '2.3%', trendUp: true, color: 'success' },
  { id: 'join_rate', label: 'Join Rate', value: '32%', icon: UserPlus, trend: '3.5%', trendUp: true, color: 'primary' },
  { id: 'completion_rate', label: 'Completion Rate', value: '94%', icon: CalendarCheck, trend: '1.1%', trendUp: true, color: 'success' },
  { id: 'cancellation_rate', label: 'Cancellation Rate', value: '6%', icon: X, trend: '0.8%', trendUp: false, color: 'destructive' },
  { id: 'wishlist_rate', label: 'Wishlist Rate', value: '24%', icon: Heart, trend: '1.4%', trendUp: true, color: 'warning' },
  { id: 'invitation_acceptance', label: 'Invitation Acceptance', value: '41%', icon: Mail, trend: '2.2%', trendUp: true, color: 'info' },
];

export const topOrganizers = [
  { name: 'Yuki Tanaka', hosted: 9, rating: 4.9, completion: 97, cancellation: 3 },
  { name: 'Aisha Patel', hosted: 7, rating: 4.8, completion: 100, cancellation: 0 },
  { name: 'Sarah Kim', hosted: 5, rating: 4.9, completion: 95, cancellation: 5 },
  { name: 'Maria Oliveira', hosted: 4, rating: 5.0, completion: 92, cancellation: 8 },
  { name: 'James Miller', hosted: 3, rating: 4.7, completion: 90, cancellation: 10 },
];

export const communityHealthKpis = [
  { id: 'reports_submitted', label: 'Reports Submitted', value: '47', icon: Flag, trend: '5', trendUp: false, color: 'destructive' },
  { id: 'reports_resolved', label: 'Reports Resolved', value: '38', icon: CheckCircle, trend: '81%', trendUp: true, color: 'success' },
  { id: 'avg_resolution_time', label: 'Avg Resolution Time', value: '4.2h', icon: Clock, trend: '0.8h', trendUp: true, color: 'info' },
  { id: 'block_rate', label: 'Block Rate', value: '2.1%', icon: X, trend: '0.3%', trendUp: false, color: 'warning' },
  { id: 'pal_requests_sent', label: 'Pal Requests Sent', value: '3,847', icon: UserPlus, trend: '8.2%', trendUp: true, color: 'primary' },
  { id: 'pal_requests_accepted', label: 'Pal Requests Accepted', value: '2,193', icon: Heart, trend: '57%', trendUp: true, color: 'success' },
];

export const relationshipInsightKpis = [
  { id: 'new_pals', label: 'New Pals Created', value: '2,193', icon: Heart, trend: '8.4%', trendUp: true, color: 'success' },
  { id: 'repeat_experiences', label: 'Repeat Experiences Together', value: '847', icon: CalendarCheck, trend: '12.1%', trendUp: true, color: 'primary' },
  { id: 'reconnect_invites', label: 'Reconnect Invitations Sent', value: '1,421', icon: MessageSquare, trend: '5.3%', trendUp: true, color: 'info' },
  { id: 'reconnect_success', label: 'Reconnect Success Rate', value: '34%', icon: CheckCircle, trend: '2.1%', trendUp: true, color: 'success' },
];

export const dailyGrowthData = [
  { day: 'Mon', members: 12480, experiences: 42 },
  { day: 'Tue', members: 12512, experiences: 38 },
  { day: 'Wed', members: 12589, experiences: 51 },
  { day: 'Thu', members: 12634, experiences: 47 },
  { day: 'Fri', members: 12698, experiences: 63 },
  { day: 'Sat', members: 12752, experiences: 78 },
  { day: 'Sun', members: 12847, experiences: 55 },
];

export const weeklyGrowthData = [
  { week: 'W1', members: 11900, newMembers: 210 },
  { week: 'W2', members: 12150, newMembers: 250 },
  { week: 'W3', members: 12480, newMembers: 330 },
  { week: 'W4', members: 12847, newMembers: 367 },
];

export const cityTrendData = [
  { city: 'Dubai', experiences: 482, members: 1842 },
  { city: 'London', experiences: 367, members: 1203 },
  { city: 'Tokyo', experiences: 298, members: 987 },
  { city: 'Seoul', experiences: 245, members: 845 },
  { city: 'Mumbai', experiences: 198, members: 712 },
  { city: 'Berlin', experiences: 167, members: 598 },
];

export const peakActivityData = [
  { hour: '6am', activity: 120 },
  { hour: '9am', activity: 340 },
  { hour: '12pm', activity: 580 },
  { hour: '3pm', activity: 420 },
  { hour: '6pm', activity: 890 },
  { hour: '9pm', activity: 1240 },
  { hour: '12am', activity: 380 },
];