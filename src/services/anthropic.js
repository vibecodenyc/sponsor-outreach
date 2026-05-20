import { callClaude, MODELS } from './claude';

export async function generateOutreachEmail({ sponsor, eventName, city, eventType, sponsorGoals }) {
  const system = `You are an expert at writing concise, compelling sponsorship outreach emails. Write an initial outreach email from an event organizer to a potential sponsor.

Keep it under 200 words. Be specific to the company and event. No generic filler. Professional but warm tone.

Respond ONLY with valid JSON — no markdown, no preamble:
{ "subject": "", "body": "" }

The body should be plain text with proper line breaks. End with "Best,\\n[Your Name]"`;

  const context = [
    `Sponsor company: ${sponsor.company || sponsor.name}`,
    `Sponsor contact: ${sponsor.contact}, ${sponsor.title}`,
    `Event name: ${eventName}`,
    `Event type: ${eventType}`,
    `City: ${city}`,
    sponsorGoals ? `Sponsor goals: ${sponsorGoals}` : '',
  ].filter(Boolean).join('\n');

  const raw = await callClaude(system, context);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Failed to parse outreach email from AI response.');
  }
}

export async function generateFollowupSequence({ sponsor, eventName, city, eventType, sponsorGoals }) {
  const system = `You are an expert at writing sponsorship follow-up email sequences. Write a 3-email follow-up sequence (Day 3, Day 7, Day 14) for a sponsorship outreach that received no reply.

Each email should be short (under 150 words), warm, and add value rather than just nudging. Each email should have a distinct angle.

Respond ONLY with valid JSON — no markdown, no preamble:
{ "emails": [{ "day": 3, "subject": "", "body": "" }, { "day": 7, "subject": "", "body": "" }, { "day": 14, "subject": "", "body": "" }] }

Bodies should be plain text with proper line breaks. End each with "Best,\\n[Your Name]"`;

  const context = [
    `Sponsor company: ${sponsor.company || sponsor.name}`,
    `Sponsor contact: ${sponsor.contact}, ${sponsor.title}`,
    `Event name: ${eventName}`,
    `Event type: ${eventType}`,
    `City: ${city}`,
    sponsorGoals ? `Sponsor goals: ${sponsorGoals}` : '',
  ].filter(Boolean).join('\n');

  const raw = await callClaude(system, context, { model: MODELS.smart });
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Failed to parse follow-up sequence from AI response.');
  }
}
