import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserData, insertData, updateData, deleteData } from '../lib/supabase';
import { useApp } from '../context/AppContext';

// Cỗ máy đa năng: Tự động kéo dữ liệu, lưu cache và cập nhật giao diện
export function useTableData<T>(tableName: string, dateColumn?: string, daysLimit?: number) {
  const { user } = useApp();
  const queryClient = useQueryClient();

  // 1. KÉO DỮ LIỆU & LƯU CACHE (Chỉ chạy khi user đã đăng nhập)
  const query = useQuery({
    queryKey: [tableName, user?.id],
    queryFn: () => fetchUserData<T>(tableName, user?.id as string, dateColumn, daysLimit),
    enabled: !!user?.id, // Nút công tắc: Có thẻ user mới cho kéo data
    staleTime: 5 * 60 * 1000, // Giữ độ tươi của data trong 5 phút
  });

  // 2. CÁC HÀM THAO TÁC (Tự động xóa Cache cũ để web tự cập nhật data mới)
  const addMutation = useMutation({
    mutationFn: (newData: any) => insertData(tableName, newData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateData(tableName, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteData(tableName, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  return { 
    data: query.data || [], 
    isLoading: query.isLoading, 
    error: query.error,
    addRecord: addMutation.mutate,
    updateRecord: updateMutation.mutate,
    deleteRecord: deleteMutation.mutate
  };
}
