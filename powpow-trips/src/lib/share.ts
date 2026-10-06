import { addDays, formatLong, formatRange, tripLength } from './dates';
import { formatMoney, totalSpent } from './money';
import type { Trip } from './types';

/** Plain-text itinerary suitable for WhatsApp / SMS / email. */
export function tripToText(trip: Trip): string {
  const lines: string[] = [];
  lines.push(`✈️ ${trip.title}`);
  lines.push(`📍 ${trip.destination}`);
  lines.push(`📅 ${formatRange(trip.startDate, trip.endDate)}`);
  if (trip.travelers.length > 1) lines.push(`👥 ${trip.travelers.join(', ')}`);
  lines.push('');

  const days = tripLength(trip.startDate, trip.endDate);
  for (let d = 0; d < days; d++) {
    const places = trip.places.filter((p) => p.dayIndex === d);
    lines.push(`Day ${d + 1}: ${formatLong(addDays(trip.startDate, d))}`);
    if (places.length === 0) lines.push('  Free day');
    places.forEach((p, i) => lines.push(`  ${i + 1}. ${p.time ? `${p.time} ` : ''}${p.name}`));
    lines.push('');
  }

  const saved = trip.places.filter((p) => p.dayIndex == null);
  if (saved.length > 0) {
    lines.push('Ideas / not scheduled:');
    saved.forEach((p) => lines.push(`  • ${p.name}`));
    lines.push('');
  }

  if (trip.expenses.length > 0) {
    lines.push(`💰 Spent so far: ${formatMoney(totalSpent(trip.expenses), trip.currency)}`);
  }
  lines.push('Planned with PowPow Trips');
  return lines.join('\n');
}
