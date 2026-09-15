export const MODERATOR_OBSERVATION_DISCLOSURE = [
  'For safety, abuse prevention, and enforcement of our community rules, authorized Nmood moderators may review content shared within Circles and Experiences. This may include messages, the sender’s displayed identity, and attachments shared in that same Circle or Experience.',
  'Moderator access is limited to the relevant Circle or Experience and does not include private direct messages or unrelated personal information. Moderator activity is access-controlled and recorded for accountability.',
];

export default function ModeratorObservationDisclosure() {
  return <section aria-labelledby="moderator-observation-title" className="space-y-2.5">
    <h3 id="moderator-observation-title" className="font-semibold">Moderator observation</h3>
    {MODERATOR_OBSERVATION_DISCLOSURE.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </section>;
}
