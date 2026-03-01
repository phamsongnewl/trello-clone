import { useState, useMemo } from 'react';
import { Alert, Box, Container, Grid, Skeleton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import { useBoards, useDeleteBoard, useUpdateBoard, useReorderBoards } from '../hooks/useBoards';

const TOOLBAR_HEIGHT = 64;
const SKELETON_COUNT = 8;

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: boards, isPending, isError, error } = useBoards();
  const deleteBoard = useDeleteBoard();
  const updateBoard = useUpdateBoard();
  const reorderBoards = useReorderBoards();

  // Sort boards by position ascending (nulls last) for stable display order
  const sortedBoards = useMemo(() => {
    if (!boards) return [];
    return [...boards].sort(
      (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)
    );
  }, [boards]);

  // Configure sensors: pointer requires 8px movement before drag starts
  // (prevents accidental drags on click); keyboard sensor for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = sortedBoards.findIndex((b) => b.id === active.id);
    const newIndex = sortedBoards.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Produce the new order and assign evenly-spaced integer positions
    const reordered = arrayMove(sortedBoards, oldIndex, newIndex);
    const updates = reordered.map((b, i) => ({ id: b.id, position: (i + 1) * 1000 }));

    reorderBoards.mutate(updates);
  };

  return (
    <>
      <Navbar />
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
          <Typography variant="h5" fontWeight={700} mb={3}>
            Your Boards
          </Typography>

          {isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error?.response?.data?.message ??
                'Failed to load boards. Please refresh the page.'}
            </Alert>
          )}

          {/* Skeleton loading state */}
          {isPending && (
            <Grid container spacing={2}>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${i}`}>
                  <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Boards grid with drag-and-drop */}
          {!isPending && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedBoards.map((b) => b.id)}
                strategy={rectSortingStrategy}
              >
                <Grid container spacing={2}>
                  {sortedBoards.map((board) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={board.id}>
                      <BoardCard
                        board={board}
                        onDelete={(id) => deleteBoard.mutate(id)}
                        onRename={(id, title) =>
                          updateBoard.mutate({ id, data: { title } })
                        }
                      />
                    </Grid>
                  ))}

                  {/* "Create new board" tile lives outside SortableContext
                      so it is never draggable and never a drop target */}
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
                        transition:
                          'background-color 0.15s ease, border-color 0.15s ease',
                        '&:hover': {
                          bgcolor: 'action.selected',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <AddIcon color="action" />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Create new board
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </SortableContext>
            </DndContext>
          )}
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
