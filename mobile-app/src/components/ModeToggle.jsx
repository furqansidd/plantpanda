import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { riderApi } from '../api/endpoints';

/** Shared toggle shown in the Profile tab for users whose account role is 'rider'. */
export default function ModeToggle() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'rider') return null;

  const switchTo = async (mode) => {
    if (mode === user.activeRole || loading) return;
    setLoading(true);
    try {
      const { data } = await riderApi.switchActiveRole(mode);
      setUser((u) => ({ ...u, activeRole: data.activeRole || mode }));
    } catch (err) {
      Alert.alert(
        'Switch Mode Failed',
        err.response?.data?.message || 'Unable to switch mode right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-row bg-neutral-100 rounded-2xl p-1 mb-4">
      <TouchableOpacity
        onPress={() => switchTo('customer')}
        disabled={loading}
        className={`flex-1 py-2.5 rounded-xl items-center ${user.activeRole === 'customer' ? 'bg-white shadow' : ''}`}
      >
        <Text className={user.activeRole === 'customer' ? 'font-semibold text-brand-700' : 'text-neutral-500'}>
          Customer Mode
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => switchTo('rider')}
        disabled={loading}
        className={`flex-1 py-2.5 rounded-xl items-center ${user.activeRole === 'rider' ? 'bg-white shadow' : ''}`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#16a34a" />
        ) : (
          <Text className={user.activeRole === 'rider' ? 'font-semibold text-brand-700' : 'text-neutral-500'}>
            Rider Mode
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
