import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCard, updateCard, deleteCard } from '../api/cards';
import {
  getBoardLabels,
  createLabel,
  addLabelToCard,
  removeLabelFromCard,
} from '../api/labels';
import {
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../api/checklists';
import { boardKeys } from './useBoardDetail';

// ─── Query Key Factories ─────────────────────────────────────────────────────

export const cardKeys = {
  detail: (cardId) => ['card', cardId],
};

export const labelKeys = {
  board: (boardId) => ['labels', boardId],
};

// ─── useCardDetail ───────────────────────────────────────────────────────────

/**
 * Fetch full card data including Labels, Checklists, and ChecklistItems.
 * Enabled only when cardId is truthy (modal is open).
 */
export const useCardDetail = (cardId) => {
  return useQuery({
    queryKey: cardKeys.detail(cardId),
    queryFn: () => getCard(cardId),
    enabled: Boolean(cardId),
    staleTime: 1000 * 15, // 15 seconds
  });
};

// ─── useBoardLabels ──────────────────────────────────────────────────────────

/**
 * Fetch all labels that belong to the board (for the label picker).
 */
export const useBoardLabels = (boardId) => {
  return useQuery({
    queryKey: labelKeys.board(boardId),
    queryFn: () => getBoardLabels(boardId),
    enabled: Boolean(boardId),
    staleTime: 1000 * 60, // 1 minute — labels change infrequently
  });
};

// ─── useUpdateCard ───────────────────────────────────────────────────────────

/**
 * Update any card fields (title, description, due_date).
 * Invalidates both the card detail query and the parent board query so
 * the card tile in the list reflects updated due date / title.
 */
export const useUpdateCard = (cardId, boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateCard(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      }
    },
  });
};

// ─── useDeleteCard ───────────────────────────────────────────────────────────

/**
 * Delete a card and invalidate the parent board query.
 * The caller is expected to close the modal onSuccess.
 */
export const useDeleteCard = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId) => deleteCard(cardId),
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      }
    },
  });
};

// ─── useCreateLabel ──────────────────────────────────────────────────────────

/**
 * Create a new label on the board and refresh the label list.
 */
export const useCreateLabel = (boardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createLabel(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.board(boardId) });
    },
  });
};

// ─── useAddLabel ─────────────────────────────────────────────────────────────

/**
 * Attach a board label to the card.
 * Invalidates card detail so CardModal re-renders with updated Labels array.
 */
export const useAddLabel = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId) => addLabelToCard(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useRemoveLabel ──────────────────────────────────────────────────────────

/**
 * Detach a label from the card.
 * Invalidates card detail so the checkmark disappears immediately.
 */
export const useRemoveLabel = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId) => removeLabelFromCard(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useCreateChecklist ──────────────────────────────────────────────────────

/**
 * Create a new checklist on the card.
 * Invalidates card detail so the new checklist appears immediately.
 */
export const useCreateChecklist = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createChecklist(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useDeleteChecklist ──────────────────────────────────────────────────────

/**
 * Delete a checklist and all its items.
 */
export const useDeleteChecklist = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checklistId) => deleteChecklist(checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useCreateChecklistItem ──────────────────────────────────────────────────

/**
 * Add a new item to a checklist.
 */
export const useCreateChecklistItem = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checklistId, content }) =>
      createChecklistItem(checklistId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useToggleChecklistItem ──────────────────────────────────────────────────

/**
 * Toggle is_checked on a checklist item.
 * Also accepts arbitrary field updates (content editing etc.).
 */
export const useToggleChecklistItem = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateChecklistItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};

// ─── useDeleteChecklistItem ──────────────────────────────────────────────────

/**
 * Delete a single checklist item.
 */
export const useDeleteChecklistItem = (cardId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId) => deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
    },
  });
};
