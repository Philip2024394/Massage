import { faker } from '@faker-js/faker';
import { TherapistProfile } from '../types';
import { massageTypeKeys, specialtyKeys } from './services';

// Base location (San Francisco area)
const baseLocation = { lat: 37.7749, lng: -122.4194 };

function generateRandomLocation(baseLocation: { lat: number; lng: number }, radiusKm: number = 25) {
  const earthRadius = 6371; // Earth's radius in kilometers
  const randomDistance = Math.random() * radiusKm;
  const randomBearing = Math.random() * 2 * Math.PI;

  const lat1 = (baseLocation.lat * Math.PI) / 180;
  const lng1 = (baseLocation.lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(randomDistance / earthRadius) +
    Math.cos(lat1) * Math.sin(randomDistance / earthRadius) * Math.cos(randomBearing)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(randomBearing) * Math.sin(randomDistance / earthRadius) * Math.cos(lat1),
    Math.cos(randomDistance / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI
  };
}

export function generateMockTherapists(count: number = 20): TherapistProfile[] {
  return Array.from({ length: count }, () => {
    const location = generateRandomLocation(baseLocation);
    const selectedMassageTypes = faker.helpers.arrayElements(massageTypeKeys, { min: 2, max: 5 });
    const selectedSpecialties = faker.helpers.arrayElements(specialtyKeys, { min: 1, max: 3 });
    const person = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    };

    return {
      id: faker.string.uuid(),
      name: `${person.firstName} ${person.lastName}`,
      email: faker.internet.email({ firstName: person.firstName, lastName: person.lastName }).toLowerCase(),
      profileImageUrl: `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
        '1494790108755-2842c96eeaa4',
        '1559839734-2b71ea197ec2',
        '1582750433-a4a4c9bb2dd4',
        '1612349317-e67c0e8c09d8',
        '1607990281-d7e2c0bd8ebc',
        '1580618672-6c369d1d6d1f',
        '1607346256-3c92d4e61040',
        '1594824019-be92db31e8ba'
      ])}?auto=format&fit=crop&w=400&h=400&q=80`,
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: faker.number.int({ min: 5, max: 150 }),
      specialties: selectedSpecialties,
      bio: `Professional massage therapist with ${faker.number.int({ min: 2, max: 15 })} years of experience. Dedicated to providing therapeutic and relaxing massage treatments in the comfort of your home.`,
      experience: faker.number.int({ min: 1, max: 15 }),
      isOnline: faker.datatype.boolean(0.7),
      status: 'active', // All mock therapists are active by default
      location: {
        lat: Number(location.lat.toFixed(6)),
        lng: Number(location.lng.toFixed(6)),
        address: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(['San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley'])
      },
      pricing: {
        session60: faker.number.int({ min: 80000, max: 150000 }),
        session90: faker.number.int({ min: 120000, max: 200000 }),
        session120: faker.number.int({ min: 160000, max: 250000 })
      },
      massageTypes: selectedMassageTypes,
      phone: `+6281${faker.string.numeric(9)}`,
      languages: faker.helpers.arrayElements(['English', 'Spanish', 'Mandarin', 'French', 'German', 'Indonesian', 'Bahasa Indonesia'], { min: 1, max: 2 }),
      certifications: ['Licensed Massage Therapist'],
      therapistNumber: faker.string.alphanumeric(8).toUpperCase(),
    };
  });
}
