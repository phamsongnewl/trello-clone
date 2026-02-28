import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useCreateBoard } from '../hooks/useBoards';

/** Predefined background colour swatches */
const PRESET_COLORS = [
  '#0052CC',
  '#0065FF',
  '#00875A',
  '#FF5630',
  '#FF8B00',
  '#6554C0',
  '#00B8D9',
];

const DEFAULT_COLOR = PRESET_COLORS[0];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function CreateBoardModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [titleError, setTitleError] = useState('');

  const createMutation = useCreateBoard();

  const handleClose = () => {
    // Reset state on close regardless of outcome
    setTitle('');
    setSelectedColor(DEFAULT_COLOR);
    setTitleError('');
    createMutation.reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Board title is required.');
      return;
    }
    setTitleError('');

    createMutation.mutate(
      { title: trimmed, background_color: selectedColor },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Create new board</DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {/* API-level error */}
          {createMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createMutation.error?.response?.data?.message ??
                'Failed to create board. Please try again.'}
            </Alert>
          )}

          {/* Board title input */}
          <TextField
            label="Board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={Boolean(titleError)}
            helperText={titleError}
            fullWidth
            autoFocus
            required
            sx={{ mb: 3 }}
          />

          {/* Colour picker */}
          <Typography variant="body2" color="text.secondary" mb={1}>
            Background colour
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setSelectedColor(color)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: selectedColor === color ? '3px solid #fff' : '3px solid transparent',
                  boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none',
                  transition: 'box-shadow 0.15s ease, border 0.15s ease',
                }}
              >
                {selectedColor === color && (
                  <CheckIcon sx={{ color: '#fff', fontSize: 18 }} />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={
              createMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
