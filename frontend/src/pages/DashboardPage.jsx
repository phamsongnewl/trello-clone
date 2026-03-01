import { useState } from 'react';
import {
  Alert,
  Box,
  Container,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import { useBoards, useDeleteBoard, useUpdateBoard } from '../hooks/useBoards';

/** Toolbar offset so content is not hidden under the fixed AppBar */
const TOOLBAR_HEIGHT = 64;

/** Number of skeleton placeholder cards to render while loading */
const SKELETON_COUNT = 8;

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: boards, isPending, isError, error } = useBoards();
  const deleteBoard = useDeleteBoard();
  const updateBoard = useUpdateBoard();

  return (
    <>
      <Navbar />

      {/* Page content — offset by AppBar height */}
      <Box
        component="main"
        sx={{
          pt: `${TOOLBAR_HEIGHT + 32}px`,
          pb: 6,
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl">
          {/* Page heading */}
          <Typography variant="h5" fontWeight={700} mb={3}>
            Your Boards
          </Typography>

          {/* Error state */}
          {isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error?.response?.data?.message ??
                'Failed to load boards. Please refresh the page.'}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Loading skeletons */}
            {isPending &&
              Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${i}`}>
                  <Skeleton
                    variant="rounded"
                    height={100}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              ))}

            {/* Board cards */}
            {!isPending &&
              boards?.map((board) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={board.id}>
                  <BoardCard
                    board={board}
                    onDelete={(id) => deleteBoard.mutate(id)}
                    onRename={(id, title) => updateBoard.mutate({ id, data: { title } })}
                  />
                </Grid>
              ))}

            {/* Create new board card */}
            {!isPending && (
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Box
                  onClick={() => setCreateModalOpen(true)}
                  sx={{
                    height: 100,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <AddIcon color="action" />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Create new board
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Create board modal */}
      <CreateBoardModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
