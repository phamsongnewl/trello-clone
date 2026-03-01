import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function BoardCard({ board, onDelete, onRename }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDelete(board.id);
  };
  const handleRenameClick = (e) => {
    e.stopPropagation();
    setRenameValue(board.title);
    setRenameOpen(true);
  };
  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== board.title) onRename(board.id, trimmed);
    setRenameOpen(false);
  };

  return (
    <>
      {/* Sortable wrapper — receives ref, drag style, and a11y attributes */}
      <Box ref={setNodeRef} style={dragStyle} {...attributes} {...listeners}>
        <Card
          elevation={2}
          sx={{
            bgcolor: board.background_color,
            borderRadius: 2,
            height: 100,
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': { transform: isDragging ? 'none' : 'translateY(-2px)', boxShadow: 6 },
            '&:hover .action-btns': { opacity: 1 },
          }}
        >
          {/*
            CardActionArea handles navigation clicks.
            We stop event propagation on the icon buttons so they don't
            trigger navigation or the drag gesture.
          */}
          <CardActionArea
            onClick={() => navigate(`/boards/${board.id}`)}
            sx={{ height: '100%', alignItems: 'flex-start' }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: 4,
                }}
              >
                {board.title}
              </Typography>
            </CardContent>
          </CardActionArea>

          <Box
            className="action-btns"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              opacity: 0,
              transition: 'opacity 0.15s ease',
              display: 'flex',
              gap: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={handleRenameClick}
              aria-label={`Rename board ${board.title}`}
              sx={{
                bgcolor: 'rgba(0,0,0,0.35)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              aria-label={`Delete board ${board.title}`}
              sx={{
                bgcolor: 'rgba(0,0,0,0.35)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Card>
      </Box>

      {/* Rename dialog */}
      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Board name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
              if (e.key === 'Escape') setRenameOpen(false);
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmRename}
            disabled={!renameValue.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete board?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>&ldquo;{board.title}&rdquo;</strong> and all its lists and
            cards will be permanently deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
