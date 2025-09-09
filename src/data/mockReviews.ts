import { faker } from '@faker-js/faker';
import { Review } from '../types';
// Corrected import: Import the function, not a non-existent variable.
import { generateMockTherapists } from './mockTherapists';

export function generateMockReviews(count: number): Review[] {
  const reviews: Review[] = [];
  // Call the function to get the list of therapists.
  const therapists = generateMockTherapists(20); // Generate a list to pick from.

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

export const mockReviews = generateMockReviews(50);
