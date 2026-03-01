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
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * @param {{
 *   board: { id: number|string, title: string, background_color: string },
 *   onDelete: (id: number|string) => void
 * }} props
 */
export default function BoardCard({ board, onDelete }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDelete(board.id);
  };

  return (
    <>
      <Card
        elevation={2}
        sx={{
          bgcolor: board.background_color,
          borderRadius: 2,
          height: 100,
          position: 'relative',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 6,
          },
          '&:hover .delete-btn': {
            opacity: 1,
          },
        }}
      >
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

        {/* Delete button — visible on hover */}
        <Box
          className="delete-btn"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            opacity: 0,
            transition: 'opacity 0.15s ease',
          }}
        >
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

      {/* Confirmation dialog */}
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
