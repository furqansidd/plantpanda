import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LogOut, User } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import ModeToggle from '../../components/ModeToggle';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-white pt-14 px-5">
      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center mb-3">
          <User size={36} color="#16a34a" />
        </View>
        <Text className="text-xl font-bold">{user?.name}</Text>
        <Text className="text-neutral-400">{user?.email}</Text>
      </View>

      <ModeToggle />

      {user?.role === 'rider' && !user?.isApproved && (
        <View className="bg-amber-50 rounded-xl p-3 mb-4">
          <Text className="text-amber-700 text-xs">
            Your rider account is pending approval. You'll be able to switch to Rider Mode and go online once
            approved.
          </Text>
        </View>
      )}

      <View className="border border-neutral-100 rounded-2xl p-4 mb-4">
        <Text className="text-neutral-400 text-xs mb-1">Phone</Text>
        <Text className="mb-3">{user?.phone}</Text>
        <Text className="text-neutral-400 text-xs mb-1">Account Type</Text>
        <Text className="capitalize">{user?.role}</Text>
      </View>

      <TouchableOpacity onPress={logout} className="flex-row items-center gap-2 py-3">
        <LogOut size={18} color="#dc2626" />
        <Text className="text-red-600 font-medium">Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
