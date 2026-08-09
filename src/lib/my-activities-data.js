const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  'https://images.unsplash.com/photo-1534528741775-5386540e6de1?w=100',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
];

export const myActivities = {
  upcoming: [
    { id: 1, type: 'circle', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', title: 'Coffee Break', date: 'Jul 4', time: 'Now', distance: '0.5 km', status: 'live', host: { name: 'Layla A.', avatar: avatars[0] }, spotsRemaining: 4 },
    { id: 4, type: 'experience', image: 'https://images.unsplash.com/photo-1452587925148-ce54479dab4e?w=600', title: 'Sunset Photography', date: 'Jul 4', time: '5:30 PM', distance: '4.5 km', status: 'upcoming', host: { name: 'Sara M.', avatar: avatars[3] }, spotsRemaining: 7 },
    { id: 6, type: 'experience', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad5fe7?w=600', title: 'Dinner at Marina', date: 'Jul 4', time: '9:00 PM', distance: '3.5 km', status: 'pending', host: { name: 'Khalid A.', avatar: avatars[5] }, spotsRemaining: 3 },
    { id: 3, type: 'circle', image: 'https://images.unsplash.com/photo-1606914502047-4728c0cbd3cc?w=600', title: 'Padel Now', date: 'Jul 4', time: 'Now', distance: '2.8 km', status: 'live', host: { name: 'Omar K.', avatar: avatars[2] }, spotsRemaining: 1 },
    { id: 12, type: 'circle', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600', title: 'Language Exchange', date: 'Jul 5', time: '5:00 PM', distance: '1.0 km', status: 'invite_only', host: { name: 'Noor H.', avatar: avatars[6] || avatars[1] }, spotsRemaining: 6 },
  ],
  hosting: [
    { id: 5, type: 'circle', image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b5c5c8?w=600', title: 'Board Games Tonight', date: 'Jul 4', time: '8:00 PM', distance: '1.8 km', status: 'live', host: { name: 'You', avatar: avatars[4] }, spotsRemaining: 4 },
    { id: 101, type: 'experience', image: 'https://images.unsplash.com/photo-1513590204371-37633284c4f4?w=600', title: 'Art Therapy Workshop', date: 'Jul 6', time: '2:00 PM', distance: '5.8 km', status: 'upcoming', host: { name: 'You', avatar: avatars[4] }, spotsRemaining: 5 },
    { id: 9, type: 'circle', image: 'https://images.unsplash.com/photo-1593810451137-5dc55705239d?w=600', title: 'Morning Meditation', date: 'Jul 5', time: '6:30 AM', distance: '2.0 km', status: 'upcoming', host: { name: 'You', avatar: avatars[4] }, spotsRemaining: 8 },
  ],
  saved: [
    { id: 11, type: 'circle', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', title: 'Jazz Listening Session', date: 'Jul 6', time: '7:00 PM', distance: '5.0 km', status: 'upcoming', host: { name: 'Marco D.', avatar: avatars[5] }, spotsRemaining: 6 },
    { id: 10, type: 'circle', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600', title: 'Sketching in the Park', date: 'Jul 6', time: '4:00 PM', distance: '3.2 km', status: 'upcoming', host: { name: 'Marco D.', avatar: avatars[5] }, spotsRemaining: 5 },
    { id: 102, type: 'experience', image: 'https://images.unsplash.com/photo-1544367559-3b0d0c1f5a3f?w=600', title: 'Sunset Yoga Session', date: 'Jul 7', time: '6:00 PM', distance: '3.1 km', status: 'upcoming', host: { name: 'Priya N.', avatar: avatars[0] }, spotsRemaining: 20 },
  ],
  completed: [
    { id: 103, type: 'experience', image: 'https://images.unsplash.com/photo-1545389336-cf0906944357?w=600', title: 'Morning Meditation Walk', date: 'Jun 28', time: '7:00 AM', distance: '2.5 km', status: 'completed', host: { name: 'Priya N.', avatar: avatars[0] }, spotsRemaining: 0 },
    { id: 104, type: 'experience', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', title: 'Coffee & Connection', date: 'Jun 25', time: '9:00 AM', distance: '1.2 km', status: 'completed', host: { name: 'Layla A.', avatar: avatars[0] }, spotsRemaining: 0 },
    { id: 2, type: 'circle', image: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600', title: 'Walk at Kite Beach', date: 'Jun 22', time: '8:00 AM', distance: '1.2 km', status: 'completed', host: { name: 'Fatima Z.', avatar: avatars[1] }, spotsRemaining: 0 },
  ],
  cancelled: [
    { id: 7, type: 'circle', image: 'https://images.unsplash.com/photo-1456513080510-7bf3fb84f82d?w=600', title: 'Study Together', date: 'Jun 20', time: '2:00 PM', distance: '0.9 km', status: 'cancelled', host: { name: 'Noor H.', avatar: avatars[1] }, spotsRemaining: 5 },
    { id: 8, type: 'circle', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600', title: 'Gym Partner', date: 'Jun 18', time: '6:00 PM', distance: '1.5 km', status: 'cancelled', host: { name: 'Yusuf I.', avatar: avatars[1] }, spotsRemaining: 2 },
  ],
};