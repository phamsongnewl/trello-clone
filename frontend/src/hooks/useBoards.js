import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoards, createBoard, updateBoard, deleteBoard } from '../api/boards';

/** Query key constant — used as a single source of truth. */
export const BOARDS_QUERY_KEY = ['boards'];

/**
 * Fetch the authenticated user's boards list.
 * @returns React Query result with `data`, `isPending`, `isError`, `error`
 */
export function useBoards() {
  return useQuery({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: getBoards,
  });
}

/**
 * Create a new board and invalidate the boards cache on success.
 * @returns React Query mutation object
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });
}

/**
 * Update an existing board and invalidate the boards cache on success.
 * @returns React Query mutation object
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateBoard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });
}

/**
 * Delete a board and invalidate the boards cache on success.
 * @returns React Query mutation object
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });
}
