import { useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

// { status: 'loading' | 'authenticated' | 'unauthenticated', user, bootstrapError }
export function useAuth() {
  return useSelector(s => s.auth);
}
