import moment from 'moment';

const parseExperienceDateTime = (experience) => {
  const year = new Date().getFullYear();
  const start = moment(`${experience.date} ${year} ${experience.time}`, 'MMM D YYYY h:mm A');
  const hours = parseFloat(experience.duration) || 1;
  const end = start.clone().add(hours, 'hours');
  return { start, end };
};

export const generateGoogleCalendarUrl = (experience) => {
  const { start, end } = parseExperienceDateTime(experience);
  const fmt = (m) => m.format('YYYYMMDDTHHmmss');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: experience.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: experience.description || '',
    location: experience.venue ? `${experience.venue.name}, ${experience.venue.address}` : '',
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
};

export const generateICSContent = (experience) => {
  const { start, end } = parseExperienceDateTime(experience);
  const fmt = (m) => m.format('YYYYMMDDTHHmmss');
  const location = experience.venue ? `${experience.venue.name}, ${experience.venue.address}` : '';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nmood//Experience//EN',
    'BEGIN:VEVENT',
    `UID:inmood-${experience.id}@inmood.app`,
    `DTSTAMP:${moment().format('YYYYMMDDTHHmmss')}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${experience.title}`,
    `DESCRIPTION:${(experience.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadICS = (experience) => {
  const ics = generateICSContent(experience);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${experience.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};