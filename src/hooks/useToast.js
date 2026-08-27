import { useState, useCallback } from 'react';

export default function useToast(duration = 4000) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
