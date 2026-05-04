export function isPotentialLeadSpam(revealsInHour: number, messagesInHour: number) {
  return revealsInHour > 20 || messagesInHour > 40;
}
