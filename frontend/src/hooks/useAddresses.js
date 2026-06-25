import { useState, useEffect } from 'react';
import api from '../services/api';

export default function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        const list = res.data || [];
        setAddresses(list);
        
        // Find the default address (is_default === 1 or true)
        const def = list.find(addr => addr.is_default) || list[0] || null;
        setDefaultAddress(def);
      } catch (err) {
        console.error('Error fetching addresses in hook:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  return { addresses, defaultAddress, isLoading };
}
