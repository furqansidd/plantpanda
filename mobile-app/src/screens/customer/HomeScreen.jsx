import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Search, Plus, MapPin } from 'lucide-react-native';
import { productApi } from '../../api/endpoints';
import { useCart } from '../../context/CartContext';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('Finding your location...');
  const { addItem, items } = useCart();

  useEffect(() => {
    loadNearby();
  }, []);

  const loadNearby = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        setLocationLabel(`Near ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        const { data } = await productApi.browse({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          radiusKm: 15,
        });
        setProducts(data.products);
      } else {
        setLocationLabel('Location permission denied — showing all plants');
        const { data } = await productApi.browse({});
        setProducts(data.products);
      }
    } catch {
      const { data } = await productApi.browse({});
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  const search = async (text) => {
    setQuery(text);
    const { data } = await productApi.browse({ q: text });
    setProducts(data.products);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <View className="flex-1 bg-white pt-14 px-5">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-2xl font-bold">PlantPanda 🌿</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <MapPin size={12} color="#999" />
            <Text className="text-neutral-400 text-xs">{locationLabel}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} className="bg-brand-600 rounded-full w-10 h-10 items-center justify-center">
          <Text className="text-white font-bold">{cartCount}</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-2.5 mb-4">
        <Search size={16} color="#999" />
        <TextInput
          placeholder="Search plants, nurseries..."
          value={query}
          onChangeText={search}
          className="ml-2 flex-1"
        />
      </View>

      {loading ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View className="flex-1 border border-neutral-100 rounded-2xl p-3">
              <View className="h-24 bg-brand-50 rounded-xl mb-2 items-center justify-center">
                <Text className="text-3xl">🪴</Text>
              </View>
              <Text className="font-semibold text-sm" numberOfLines={1}>{item.name}</Text>
              <Text className="text-neutral-400 text-xs" numberOfLines={1}>{item.businessId?.name}</Text>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="font-bold">Rs {item.price}</Text>
                <TouchableOpacity
                  onPress={() => addItem(item, item.businessId?._id, item.businessId?.name)}
                  className="bg-brand-600 rounded-full w-7 h-7 items-center justify-center"
                >
                  <Plus size={15} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text className="text-neutral-400 text-center mt-10">No plants found nearby.</Text>}
        />
      )}
    </View>
  );
}
