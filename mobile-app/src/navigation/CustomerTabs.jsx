import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ShoppingCart, ListOrdered, User } from 'lucide-react-native';

import HomeScreen from '../screens/customer/HomeScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import CustomerOrdersScreen from '../screens/customer/CustomerOrdersScreen';
import TrackingScreen from '../screens/customer/TrackingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const OrdersStackNav = createNativeStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="Cart" component={CartScreen} />
      <HomeStackNav.Screen name="Checkout" component={CheckoutScreen} />
    </HomeStackNav.Navigator>
  );
}

function OrdersStack() {
  return (
    <OrdersStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStackNav.Screen name="OrdersMain" component={CustomerOrdersScreen} />
      <OrdersStackNav.Screen name="Tracking" component={TrackingScreen} />
    </OrdersStackNav.Navigator>
  );
}

export default function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#16a34a' }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ tabBarIcon: ({ color, size }) => <ListOrdered color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
