import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoardById } from '../api/boards';
import { createList, deleteList } from '../api/lists';
import { createCard, moveCard } from '../api/cards';

// ─── Query Key Factory ───────────────────────────────────────────────────────

export const boardKeys = {
  detail: (boardId) => ['board', boardId],
};

// ─── useBoardDetail ──────────────────────────────────────────────────────────

/**
 * Fetches full board data including lists and cards.
 * Expected shape: { id, title, background_color, lists: [{ id, title, position, cards: [...] }] }
 */
export const useBoardDetail = (boardId) => {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => getBoardById(boardId),
    enabled: Boolean(boardId),
    staleTime: 1000 * 30, // 30 seconds
  });
};

// ─── useCreateList ───────────────────────────────────────────────────────────

/**
 * Mutation: create a list on the board.
 * Invalidates board query on success so the new list appears.
 */
export const useCreateList = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createList(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
};

// ─── useDeleteList ───────────────────────────────────────────────────────────

/**
 * Mutation: delete a list from the board.
 * Invalidates board query on success.
 */
export const useDeleteList = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId) => deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
};

// ─── useCreateCard ───────────────────────────────────────────────────────────

/**
 * Mutation: create a card inside a list.
 * Invalidates board query on success.
 */
export const useCreateCard = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }) => createCard(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
};

// ─── useMoveCard ─────────────────────────────────────────────────────────────

/**
 * Mutation: move a card to a different list/position.
 *
 * Uses optimistic update:
 * 1. Snapshot current board data.
 * 2. Immediately update the cached board so UI reflects the drop.
 * 3. On error, roll back to the snapshot.
 * 4. On settled, refetch to ensure server state is reflected.
 */
export const useMoveCard = (boardId) => {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ cardId, listId, position }) =>
      moveCard(cardId, { listId, position }),

    onMutate: async ({ cardId, listId, position }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData(queryKey);

      // Optimistically update board cache
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;

        // Find and remove the card from its current list
        let movedCard = null;
        const listsWithoutCard = old.lists.map((list) => {
          const cardIndex = list.cards.findIndex((c) => c.id === cardId);
          if (cardIndex === -1) return list;
          movedCard = { ...list.cards[cardIndex] };
          return {
            ...list,
            cards: list.cards.filter((c) => c.id !== cardId),
          };
        });

        if (!movedCard) return old;

        // Insert the card into the destination list at the correct position
        const updatedCard = { ...movedCard, list_id: listId, position };
        const listsWithCard = listsWithoutCard.map((list) => {
          if (list.id !== listId) return list;
          const newCards = [...list.cards, updatedCard].sort(
            (a, b) => a.position - b.position
          );
          return { ...list, cards: newCards };
        });

        return { ...old, lists: listsWithCard };
      });

      return { previousBoard };
    },

    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKey, context.previousBoard);
      }
    },

    onSettled: () => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
