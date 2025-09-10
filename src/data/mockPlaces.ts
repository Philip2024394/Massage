import { faker } from '@faker-js/faker';
import { MassagePlaceProfile } from '../types';
import { massageTypeKeys } from './services';

const baseLocation = { lat: 37.7749, lng: -122.4194 };

function generateRandomLocation(baseLocation: { lat: number; lng: number }, radiusKm: number = 25) {
  const earthRadius = 6371;
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

export function generateMockPlaces(count: number = 15): MassagePlaceProfile[] {
  return Array.from({ length: count }, () => {
    const location = generateRandomLocation(baseLocation);
    const selectedServices = faker.helpers.arrayElements(massageTypeKeys, { min: 3, max: 8 });

    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Spa & Wellness',
      profileImageUrl: `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
        '1515377944-cb0e14a5a2e4',
        '1555353540-802c6a0e2f4b',
        '1597361153-73311e82d8d4',
        '1620246284893-a44c48b0c5a6',
        '1519922188382-43d5381a14d5'
      ])}?auto=format&fit=crop&w=400&h=400&q=80`,
      rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
      reviewCount: faker.number.int({ min: 10, max: 250 }),
      address: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(['San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Berkeley']),
      location: {
        lat: Number(location.lat.toFixed(6)),
        lng: Number(location.lng.toFixed(6)),
      },
      phone: `+6281${faker.string.numeric(9)}`,
      services: selectedServices,
      isOnline: faker.datatype.boolean(0.8), // Represents if the place is currently open
      status: 'active',
    };
  });
}
