import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useApiGet<T>(key: string[], url: string) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api.get<T>(url),
  });
}

export function useApiPost<T, R = T>(url: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation<R, Error, T>({
    mutationFn: (data) => api.post<R>(url, data),
    onSuccess,
  });
}

export function useApiPut<T, R = T>(url: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation<R, Error, T>({
    mutationFn: (data) => api.put<R>(url, data),
    onSuccess,
  });
}

export function useApiDelete(url: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => api.delete(url),
    onSuccess,
  });
}
