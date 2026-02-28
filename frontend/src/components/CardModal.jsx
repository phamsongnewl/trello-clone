import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import {
  useCardDetail,
  useUpdateCard,
  useDeleteCard,
  useCreateChecklist,
} from '../hooks/useCardDetail';
import DueDatePicker from './DueDatePicker';
import LabelPicker from './LabelPicker';
import ChecklistSection from './ChecklistSection';

/**
 * CardModal
 *
 * Full-screen card editor dialog.
 *
 * Sections (top-to-bottom):
 *   1. Title  — editable TextField, auto-saves on blur
 *   2. Description — multiline TextField, auto-saves on blur
 *   3. Labels — LabelPicker component
 *   4. Due Date — DueDatePicker component
 *   5. Checklists — one ChecklistSection per checklist
 *   6. "Add Checklist" inline form
 *   7. "Delete Card" danger button
 *
 * Loading state: Skeleton placeholders while react-query fetch is in progress.
 *
 * Props:
 *   open    — boolean   — whether the dialog is visible
 *   onClose — () => void
 *   cardId  — string    — ID of the card to display/edit
 *   boardId — string    — parent board ID (required for label picker + board invalidation)
 */
const CardModal = ({ open, onClose, cardId, boardId }) => {
  // ── Remote data ────────────────────────────────────────────────────────────
  const { data: card, isPending, isError } = useCardDetail(open ? cardId : null);
  const updateCard = useUpdateCard(cardId, boardId);
  const deleteCard = useDeleteCard(boardId);
  const createChecklist = useCreateChecklist(cardId);

  // ── Local state ────────────────────────────────────────────────────────────
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('');
  const titleInitialized = useRef(false);

  // Sync local fields when the card data first loads (or when a different card is opened)
  useEffect(() => {
    if (card && !titleInitialized.current) {
      setLocalTitle(card.title ?? '');
      setLocalDescription(card.description ?? '');
      titleInitialized.current = true;
    }
  }, [card]);

  // Reset init flag when modal closes so next open gets fresh data
  useEffect(() => {
    if (!open) {
      titleInitialized.current = false;
      setAddingChecklist(false);
      setChecklistTitle('');
    }
  }, [open]);

  // ── Auto-save handlers ─────────────────────────────────────────────────────

  const handleTitleBlur = () => {
    const trimmed = localTitle.trim();
    if (!trimmed || trimmed === card?.title) return;
    updateCard.mutate({ title: trimmed }, {
      onError: () => setLocalTitle(card?.title ?? ''),
    });
  };

  const handleDescriptionBlur = () => {
    const trimmed = localDescription.trim();
    if (trimmed === (card?.description ?? '')) return;
    updateCard.mutate({ description: trimmed });
  };

  // ── Due date save ──────────────────────────────────────────────────────────

  const handleDueDateUpdate = (isoDate) => {
    updateCard.mutate({ due_date: isoDate });
  };

  // ── Checklist creation ─────────────────────────────────────────────────────

  const handleAddChecklist = () => {
    if (!checklistTitle.trim()) return;
    createChecklist.mutate(
      { title: checklistTitle.trim() },
      {
        onSuccess: () => {
          setChecklistTitle('');
          setAddingChecklist(false);
        },
      }
    );
  };

  const handleChecklistKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklist();
    }
    if (e.key === 'Escape') {
      setAddingChecklist(false);
      setChecklistTitle('');
    }
  };

  // ── Delete card ────────────────────────────────────────────────────────────

  const handleDeleteCard = () => {
    deleteCard.mutate(cardId, { onSuccess: onClose });
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const checklists = Array.isArray(card?.Checklists) ? card.Checklists : [];
  const cardLabels = Array.isArray(card?.Labels) ? card.Labels : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="card-modal-title"
    >
      {/* ── Dialog title bar ── */}
      <DialogTitle
        id="card-modal-title"
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pr: 6 }}
      >
        {isPending ? (
          <Skeleton width="60%" height={32} />
        ) : (
          <TextField
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            variant="standard"
            fullWidth
            inputProps={{ 'aria-label': 'Card title', style: { fontWeight: 700, fontSize: '1.25rem' } }}
            disabled={updateCard.isPending}
          />
        )}
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ── Main content ── */}
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {isError && (
          <Alert severity="error">Failed to load card data. Please close and try again.</Alert>
        )}

        {/* ── Description ── */}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            Description
          </Typography>
          {isPending ? (
            <>
              <Skeleton height={24} />
              <Skeleton height={24} width="80%" />
            </>
          ) : (
            <TextField
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              multiline
              minRows={3}
              maxRows={12}
              fullWidth
              placeholder="Add a more detailed description…"
              variant="outlined"
              size="small"
              disabled={updateCard.isPending}
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>

        <Divider />

        {/* ── Labels ── */}
        {isPending ? (
          <Box>
            <Skeleton width={60} height={20} />
            <Skeleton width={120} height={28} sx={{ mt: 0.5 }} />
          </Box>
        ) : (
          <LabelPicker cardId={cardId} boardId={boardId} cardLabels={cardLabels} />
        )}

        <Divider />

        {/* ── Due date ── */}
        {isPending ? (
          <Box>
            <Skeleton width={70} height={20} />
            <Skeleton width={140} height={32} sx={{ mt: 0.5 }} />
          </Box>
        ) : (
          <DueDatePicker
            dueDate={card?.due_date ?? null}
            onUpdate={handleDueDateUpdate}
            disabled={updateCard.isPending}
          />
        )}

        <Divider />

        {/* ── Checklists ── */}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            Checklists
          </Typography>

          {isPending ? (
            <Box sx={{ mt: 1 }}>
              <Skeleton height={20} width="40%" />
              <Skeleton height={12} sx={{ mt: 0.5 }} />
              <Skeleton height={20} sx={{ mt: 1 }} />
              <Skeleton height={20} sx={{ mt: 0.5 }} />
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              {checklists.length === 0 && (
                <Typography variant="body2" color="text.disabled">
                  No checklists yet.
                </Typography>
              )}

              {checklists.map((cl) => (
                <ChecklistSection key={cl.id} checklist={cl} cardId={cardId} />
              ))}
            </Box>
          )}

          {/* ── Add checklist inline form ── */}
          {addingChecklist ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <TextField
                size="small"
                label="Checklist title"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                onKeyDown={handleChecklistKeyDown}
                autoFocus
                fullWidth
                disabled={createChecklist.isPending}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddChecklist}
                  disabled={createChecklist.isPending || !checklistTitle.trim()}
                >
                  {createChecklist.isPending ? 'Adding…' : 'Add checklist'}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAddingChecklist(false);
                    setChecklistTitle('');
                  }}
                  disabled={createChecklist.isPending}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            !isPending && (
              <Button
                size="small"
                startIcon={<PlaylistAddIcon />}
                onClick={() => setAddingChecklist(true)}
                sx={{ mt: 1 }}
              >
                Add checklist
              </Button>
            )
          )}
        </Box>
      </DialogContent>

      {/* ── Footer actions ── */}
      <DialogActions sx={{ justifyContent: 'flex-start', px: 3, py: 1.5 }}>
        <Tooltip title="Delete this card permanently">
          <span>
            <Button
              color="error"
              variant="outlined"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteCard}
              disabled={deleteCard.isPending || isPending}
            >
              {deleteCard.isPending ? 'Deleting…' : 'Delete card'}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default CardModal;
