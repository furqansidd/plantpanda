import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import CustomerTabs from './CustomerTabs';
import RiderTabs from './RiderTabs';

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'rider' && user.activeRole === 'rider' ? (
        <RiderTabs />
      ) : (
        <CustomerTabs />
      )}
    </NavigationContainer>
  );
}
