import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/ui';
import { TripForm } from '@/features/trip/trip-form';
import { useStore, useTrip } from '@/store/trips-store';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const { dispatch } = useStore();

  if (!trip) return <EmptyState icon="alert-circle-outline" title="Trip not found" message="It may have been deleted." />;

  const usedInExpenses = [...new Set(trip.expenses.flatMap((e) => [e.paidBy, ...e.splitWith]))];

  return (
    <TripForm
      initial={trip}
      lockedTravelers={usedInExpenses}
      submitLabel="Save changes"
      onSubmit={(values) => {
        dispatch({ type: 'updateTrip', tripId: trip.id, patch: values });
        router.back();
      }}
    />
  );
}
