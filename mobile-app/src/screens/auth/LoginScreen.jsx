import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      // RootNavigator reacts to `user` state automatically
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-center px-6"
    >
      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center mb-3">
          <Leaf color="white" size={32} />
        </View>
        <Text className="text-2xl font-bold">PlantPanda</Text>
        <Text className="text-neutral-400 mt-1">Fresh plants, delivered fast</Text>
      </View>

      <Text className="text-sm font-medium text-neutral-700 mb-1">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-4"
      />

      <Text className="text-sm font-medium text-neutral-700 mb-1">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        className="border border-neutral-200 rounded-xl px-4 py-3 mb-2"
      />

      {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={busy}
        className="bg-brand-600 rounded-xl py-3.5 items-center mt-3"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <Text className="text-white font-semibold text-base">{busy ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} className="items-center mt-5">
        <Text className="text-neutral-500">
          New here? <Text className="text-brand-700 font-semibold">Create an account</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
