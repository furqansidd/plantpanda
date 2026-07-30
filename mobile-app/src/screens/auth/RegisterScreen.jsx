import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async () => {
    setError('');
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text className="text-2xl font-bold mb-1">Create your account</Text>
      <Text className="text-neutral-400 mb-6">Sign up as a customer or a rider</Text>

      <View className="flex-row gap-3 mb-5">
        <TouchableOpacity
          onPress={() => update('role', 'customer')}
          className={`flex-1 py-3 rounded-xl border items-center ${form.role === 'customer' ? 'bg-brand-50 border-brand-500' : 'border-neutral-200'}`}
        >
          <Text className={form.role === 'customer' ? 'text-brand-700 font-semibold' : 'text-neutral-500'}>
            Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => update('role', 'rider')}
          className={`flex-1 py-3 rounded-xl border items-center ${form.role === 'rider' ? 'bg-brand-50 border-brand-500' : 'border-neutral-200'}`}
        >
          <Text className={form.role === 'rider' ? 'text-brand-700 font-semibold' : 'text-neutral-500'}>
            Rider
          </Text>
        </TouchableOpacity>
      </View>

      {form.role === 'rider' && (
        <View className="bg-amber-50 rounded-xl p-3 mb-4">
          <Text className="text-amber-700 text-xs">
            Rider accounts require Super Admin approval before you can go online and accept deliveries.
          </Text>
        </View>
      )}

      <TextInput
        placeholder="Full name"
        value={form.name}
        onChangeText={(v) => update('name', v)}
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-3"
      />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(v) => update('email', v)}
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-3"
      />
      <TextInput
        placeholder="Phone"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => update('phone', v)}
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-3"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => update('password', v)}
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-3"
      />

      {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleRegister}
        disabled={busy}
        className="bg-brand-600 rounded-xl py-3.5 items-center mt-2"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <Text className="text-white font-semibold text-base">{busy ? 'Creating account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} className="items-center mt-5">
        <Text className="text-neutral-500">
          Already have an account? <Text className="text-brand-700 font-semibold">Sign in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
