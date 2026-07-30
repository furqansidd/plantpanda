import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, ListOrdered, Wallet, User, Banknote } from 'lucide-react-native';

import RiderDashboardScreen from '../screens/rider/RiderDashboardScreen';
import ActiveDeliveryScreen from '../screens/rider/ActiveDeliveryScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import LedgerScreen from '../screens/rider/LedgerScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const DashboardStackNav = createNativeStackNavigator();

function DashboardStack() {
  return (
    <DashboardStackNav.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStackNav.Screen name="RiderDashboard" component={RiderDashboardScreen} />
      <DashboardStackNav.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </DashboardStackNav.Navigator>
  );
}

export default function RiderTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#16a34a' }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{ title: 'History', tabBarIcon: ({ color, size }) => <ListOrdered color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Banknote color={color} size={size} /> }}
      />
      <Tab.Screen
        name="CashLedger"
        component={LedgerScreen}
        options={{ title: 'Cash', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
