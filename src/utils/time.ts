import { OpeningHours } from '../types';

export const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

export const isPlaceOpen = (openingHours: OpeningHours | null): boolean => {
  if (!openingHours) {
    return false;
  }

  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  
  const hoursForToday = openingHours[dayOfWeek as keyof OpeningHours];

  if (!hoursForToday || !hoursForToday.open || !hoursForToday.close) {
    return false;
  }

  const [openHour, openMinute] = hoursForToday.open.split(':').map(Number);
  const [closeHour, closeMinute] = hoursForToday.close.split(':').map(Number);

  const openTime = new Date();
  openTime.setHours(openHour, openMinute, 0, 0);

  const closeTime = new Date();
  closeTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Handle overnight hours
  if (closeTime <= openTime) {
    closeTime.setDate(closeTime.getDate() + 1);
    // if current time is also "tomorrow", adjust it
    if (now < openTime) {
        now.setDate(now.getDate() + 1);
    }
  }

  return now >= openTime && now < closeTime;
};

export const getTodaysHours = (openingHours: OpeningHours | null, t: (key: string, replacements?: { [key: string]: string | number }) => string): string => {
    if (!openingHours) {
        return t('placeCard.closedToday');
    }

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    const hours = openingHours[dayOfWeek as keyof OpeningHours];

    if (!hours || !hours.open || !hours.close) {
        return t('placeCard.closedToday');
    }

    return t('placeCard.openToday', { open: hours.open, close: hours.close });
}
