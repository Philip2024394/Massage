import { faker } from '@faker-js/faker';
import { Review, TherapistProfile } from '../types';

export function generateMockReviews(count: number, therapists: TherapistProfile[]): Review[] {
  const reviews: Review[] = [];
  if (therapists.length === 0) return [];

  for (let i = 0; i < count; i++) {
    const therapist = faker.helpers.arrayElement(therapists);
    reviews.push({
      id: faker.string.uuid(),
      therapistId: therapist.id,
      customerName: faker.person.fullName(),
      customerWhatsApp: `+6281${faker.string.numeric(9)}`,
      rating: faker.number.int({ min: 4, max: 5 }),
      comment: faker.lorem.paragraph({ min: 1, max: 3 }),
      status: faker.helpers.arrayElement(['approved', 'approved', 'pending']),
      createdAt: faker.date.past().toISOString(),
    });
  }
  return reviews;
}
