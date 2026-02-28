import { useState, useRef, useEffect } from 'react';
import { Box, Button, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateCard } from '../hooks/useBoardDetail';

/**
 * AddCardForm
 *
 * Renders a "+ Add card" button at the bottom of a list column.
 * When clicked, expands to an inline textarea + Save / Cancel.
 *
 * Props:
 *   listId   — ID of the list to add the card to
 *   boardId  — ID of the parent board (used to invalidate query)
 */
const AddCardForm = ({ listId, boardId }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  const { mutate: createCard, isPending } = useCreateCard(boardId);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setTitle('');
  };

  const handleClose = () => {
    setOpen(false);
    setTitle('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createCard(
      { listId, data: { title: trimmed } },
      {
        onSuccess: () => {
          setTitle('');
          inputRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter submits; Escape cancels
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!open) {
    return (
      <Button
        startIcon={<AddIcon />}
        onClick={handleOpen}
        size="small"
        sx={{
          color: 'text.secondary',
          justifyContent: 'flex-start',
          width: '100%',
          mt: 0.5,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.06)',
            color: 'text.primary',
          },
        }}
      >
        Add card
      </Button>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}
    >
      <TextField
        inputRef={inputRef}
        multiline
        minRows={2}
        maxRows={6}
        size="small"
        placeholder="Enter card title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        fullWidth
        autoComplete="off"
        sx={{ backgroundColor: 'white', borderRadius: 1 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={isPending || !title.trim()}
          sx={{ flexShrink: 0 }}
        >
          {isPending ? 'Adding…' : 'Add card'}
        </Button>
        <IconButton size="small" onClick={handleClose} disabled={isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default AddCardForm;
