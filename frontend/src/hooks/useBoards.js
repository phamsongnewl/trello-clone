import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  reorderBoards,
} from '../api/boards';

export const BOARDS_QUERY_KEY = ['boards'];

export function useBoards() {
  return useQuery({ queryKey: BOARDS_QUERY_KEY, queryFn: getBoards });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY }),
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBoard(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY }),
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteBoard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY }),
  });
}

export function useReorderBoards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boards) => reorderBoards(boards),
    onMutate: async (boards) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: BOARDS_QUERY_KEY });

      // Snapshot the previous cache value for rollback on error
      const previousBoards = queryClient.getQueryData(BOARDS_QUERY_KEY);

      // Build a position map from the incoming boards array
      const positionMap = Object.fromEntries(boards.map((b) => [b.id, b.position]));

      // Optimistically update the cache: sort boards by their new positions
      queryClient.setQueryData(BOARDS_QUERY_KEY, (old) => {
        if (!old) return old;
        return [...old]
          .map((b) => ({
            ...b,
            position: positionMap[b.id] !== undefined ? positionMap[b.id] : b.position,
          }))
          .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      });

      return { previousBoards };
    },
    onError: (_err, _boards, context) => {
      // Roll back to the snapshot on network/server error
      if (context?.previousBoards) {
        queryClient.setQueryData(BOARDS_QUERY_KEY, context.previousBoards);
      }
    },
    onSettled: () => {
      // Always re-sync with the server after mutation settles
      queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });
}
