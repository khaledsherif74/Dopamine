import { useDispatch, useSelector } from "react-redux";

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

export function useAuth() {
  return useSelector((s) => s.auth);
}
