import { router, useLocalSearchParams } from 'expo-router';

import { TripForm, defaultTripValues } from '@/features/trip/trip-form';
import { newId, useStore } from '@/store/trips-store';

const STARTER_CHECKLIST = ['Passport / ID', 'Tickets & bookings', 'Phone charger', 'Medicines', 'Cash & cards'];

export default function NewTripScreen() {
  const { data, dispatch } = useStore();
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  return (
    <TripForm
      initial={{ ...defaultTripValues(data.settings.userName, data.settings.defaultCurrency), destination: destination ?? '' }}
      submitLabel="Create trip"
      onSubmit={(values) => {
        const id = newId();
        const now = Date.now();
        dispatch({
          type: 'addTrip',
          trip: {
            id,
            ...values,
            notes: '',
            places: [],
            expenses: [],
            checklist: STARTER_CHECKLIST.map((text) => ({ id: newId(), text, done: false })),
            createdAt: now,
            updatedAt: now,
          },
        });
        router.replace({ pathname: '/trip/[id]', params: { id } });
      }}
    />
  );
}
