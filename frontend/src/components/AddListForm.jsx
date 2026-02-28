import { useState, useRef, useEffect } from 'react';
import { Box, Button, TextField, Paper, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateList } from '../hooks/useBoardDetail';

/**
 * AddListForm
 *
 * Renders a "Add list" button. When clicked, expands to an inline form
 * with a text field and Save / Cancel buttons.
 *
 * Props:
 *   boardId  — ID of the board to create the list in
 */
const AddListForm = ({ boardId }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  const { mutate: createList, isPending } = useCreateList(boardId);

  // Auto-focus the input when the form opens
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

    createList(
      { title: trimmed },
      {
        onSuccess: () => {
          setTitle('');
          // Keep form open so user can add another list quickly
          inputRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!open) {
    return (
      <Box sx={{ minWidth: 280, flexShrink: 0 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: 'white',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.35)',
            },
            width: '100%',
            justifyContent: 'flex-start',
            px: 2,
            py: 1.5,
          }}
        >
          Add list
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 280, flexShrink: 0 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{ p: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <TextField
          inputRef={inputRef}
          size="small"
          placeholder="Enter list title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          fullWidth
          autoComplete="off"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isPending || !title.trim()}
            sx={{ flexShrink: 0 }}
          >
            {isPending ? 'Saving…' : 'Add list'}
          </Button>
          <IconButton size="small" onClick={handleClose} disabled={isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddListForm;
