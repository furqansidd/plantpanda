import { View, Text } from 'react-native';

const STYLES = {
  pending: { bg: '#fef3c7', fg: '#b45309' },
  accepted: { bg: '#dbeafe', fg: '#1d4ed8' },
  ready_for_pickup: { bg: '#ede9fe', fg: '#6d28d9' },
  rider_assigned: { bg: '#e0e7ff', fg: '#4338ca' },
  picked_up: { bg: '#cffafe', fg: '#0e7490' },
  delivered: { bg: '#dcfce7', fg: '#15803d' },
  cancelled: { bg: '#fee2e2', fg: '#b91c1c' },
};

const LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || { bg: '#f1f1f1', fg: '#666' };
  return (
    <View style={{ backgroundColor: style.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: style.fg, fontSize: 12, fontWeight: '600' }}>{LABELS[status] || status}</Text>
    </View>
  );
}
