import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useBoardDetail, useMoveCard, useMoveList, useDeleteList } from '../hooks/useBoardDetail';
import ListColumn from '../components/ListColumn';
import AddListForm from '../components/AddListForm';

/**
 * BoardPage
 *
 * Full board view: fetches board data, renders list columns in a horizontal
 * scrolling flex container, and wraps everything in a <DragDropContext> so
 * cards can be dragged between lists.
 *
 * Route: /boards/:boardId
 *
 * ── Drag & Drop flow ──────────────────────────────────────────
 *
 *   DragDropContext.onDragEnd  →  handleDragEnd
 *     • Guard: no destination, or dropped in same place → no-op
 *     • Calculate new position using midpoint of neighbouring cards:
 *         before = card just above destination slot's position  (or 0)
 *         after  = card at destination slot's position          (or before + 2000)
 *         newPos = (before + after) / 2
 *     • Fire useMoveCard mutation (optimistic update inside the hook)
 *
 * The midpoint strategy allows indefinite insertion without renumbering.
 * Backend stores positions as floats. When gaps get too small a maintenance
 * job can renumber, but in practice this is rare for typical usage.
 */
const BoardPage = () => {
  const { boardId } = useParams();

  const {
    data: board,
    isPending,
    isError,
    error,
  } = useBoardDetail(boardId);

  const { mutate: moveCard } = useMoveCard(boardId);
  const { mutate: moveList } = useMoveList(boardId);
  const { mutate: deleteList } = useDeleteList(boardId);
  const [isDraggingList, setIsDraggingList] = useState(false);

  const sortedLists = [...(board?.lists ?? [])].sort(
    (a, b) => a.position - b.position
  );

  // ── Drag Start Handler ─────────────────────────────────────────────────────

  const handleDragStart = (result) => {
    if (result.type === 'LIST') {
      setIsDraggingList(true);
    }
  };

  // ── Drag End Handler ───────────────────────────────────────────────────────

  const handleDragEnd = (result) => {
    // Always clear drag state on drop
    setIsDraggingList(false);

    const { draggableId, type, source, destination } = result;

    // No destination: dropped outside a droppable → ignore
    if (!destination) return;

    // Dropped back in the same spot → ignore
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (!board) return;

    // ── LIST drag ──────────────────────────────────────────────────────────
    if (type === 'LIST') {
      // Build the new ordered array by moving the dragged list from source.index
      // to destination.index
      const reordered = [...sortedLists];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // Assign clean positions (1000, 2000, 3000…) so server and cache agree
      const lists = reordered.map((l, i) => ({
        ...l,
        position: (i + 1) * 1000,
      }));

      moveList({ lists });
      return;
    }

    // ── CARD drag ─────────────────────────────────────────────────────────
    const destList = board.lists.find((l) => l.id === destination.droppableId);
    if (!destList) return;

    const destCards = [...(destList.cards ?? [])].sort(
      (a, b) => a.position - b.position
    );

    const isSameList = source.droppableId === destination.droppableId;
    const filteredDestCards = isSameList
      ? destCards.filter((c) => c.id !== draggableId)
      : destCards;

    const before = filteredDestCards[destination.index - 1]?.position ?? 0;
    const after =
      filteredDestCards[destination.index]?.position ?? before + 2000;
    const newPosition = (before + after) / 2;

    moveCard({
      cardId: draggableId,
      listId: destination.droppableId,
      position: newPosition,
    });
  };

  // ── Render: Loading ────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ── Render: Error ──────────────────────────────────────────────────────────

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          {error?.response?.data?.error ?? error?.message ?? 'Failed to load board.'}
        </Alert>
      </Box>
    );
  }

  // ── Render: Board ──────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        // Use board background color or a sensible default
        backgroundColor: board.background_color || '#1565c0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Board Header ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          backgroundColor: 'rgba(0,0,0,0.20)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Breadcrumbs
          sx={{ color: 'rgba(255,255,255,0.85)', '& li': { lineHeight: 1 } }}
        >
          <MuiLink
            component={RouterLink}
            to="/dashboard"
            underline="hover"
            sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}
          >
            Boards
          </MuiLink>
          <Typography
            sx={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}
          >
            {board.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* ── DragDropContext + Columns ──────────────────────────────────────── */}
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 2,
            px: 2,
            py: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            // Ensure the scroll area fills height so the board looks full-bleed
            minHeight: 0,
            // Custom scrollbar styling
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,0.35)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Droppable droppableId="board" direction="horizontal" type="LIST">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 2,
                  minHeight: 80,
                }}
              >
                {sortedLists.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        sx={{ display: 'inline-block' }}
                      >
                        <ListColumn
                          list={list}
                          boardId={boardId}
                          onDelete={deleteList}
                          onCardClick={(card) => console.log('Card clicked:', card.id)}
                          dragHandleProps={dragProvided.dragHandleProps}
                          isDragging={dragSnapshot.isDragging}
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}

                <AddListForm boardId={boardId} disabled={isDraggingList} />
              </Box>
            )}
          </Droppable>
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default BoardPage;
