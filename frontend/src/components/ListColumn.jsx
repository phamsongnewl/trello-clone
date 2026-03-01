import { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CardItem from './CardItem';
import AddCardForm from './AddCardForm';

/**
 * ListColumn
 *
 * Renders a single board list as a vertical card column.
 * The entire card area is a @hello-pangea/dnd <Droppable>.
 *
 * Props:
 *   list      — { id: string, title: string, cards: Card[] }
 *   boardId   — parent board ID (needed by AddCardForm / delete mutation)
 *   onDelete  — (listId) => void  — called when user confirms list deletion
 *   onCardClick — (card) => void  — called when a card tile is clicked
 *
 * CRITICAL NOTES:
 *   • droppableId must match what handleDragEnd uses (list.id — a UUID string).
 *   • type="CARD" keeps card droppables separate from any future list droppable.
 *   • provided.placeholder is MANDATORY — without it collapsed columns break DnD.
 *   • minHeight on the cards container ensures empty lists are still droppable.
 */
const ListColumn = ({ list, boardId, onDelete, onCardClick, dragHandleProps, isDragging }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const titleInputRef = useRef(null);

  // Keep local title in sync if parent data refreshes
  useEffect(() => {
    if (!editingTitle) {
      setTitleValue(list.title);
    }
  }, [list.title, editingTitle]);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  const handleTitleClick = () => {
    setEditingTitle(true);
  };

  const handleTitleBlur = () => {
    // TODO (future): call updateList mutation here
    setEditingTitle(false);
    if (!titleValue.trim()) {
      setTitleValue(list.title); // revert if cleared
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      titleInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setTitleValue(list.title);
      setEditingTitle(false);
    }
  };

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Delete list "${list.title}" and all its cards? This cannot be undone.`
      )
    ) {
      onDelete?.(list.id);
    }
  };

  // Sort cards by position ascending before rendering
  const sortedCards = [...(list.cards ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        minWidth: 280,
        maxWidth: 280,
        flexShrink: 0,
        borderRadius: 2,
        backgroundColor: '#ebecf0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 140px)',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      {/* ── Column Header ─────────────────────────────────── */}
      <Box
        {...dragHandleProps}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          pt: 1.5,
          pb: 0.5,
          gap: 0.5,
          cursor: dragHandleProps ? 'grab' : 'default',
        }}
      >
        {editingTitle ? (
          <TextField
            inputRef={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            variant="outlined"
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
              },
            }}
          />
        ) : (
          <Typography
            variant="subtitle2"
            fontWeight={700}
            onClick={handleTitleClick}
            sx={{
              flex: 1,
              cursor: 'pointer',
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
              wordBreak: 'break-word',
            }}
          >
            {list.title}
          </Typography>
        )}

        <Tooltip title="Delete list" placement="top">
          <IconButton
            size="small"
            onClick={handleDeleteClick}
            sx={{ flexShrink: 0, color: 'text.secondary' }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Droppable Card Area ───────────────────────────── */}
      <Droppable droppableId={list.id} type="CARD">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: 1,
              pt: 0.5,
              pb: 0.5,
              // CRITICAL: empty lists must have a minimum height so cards
              // can be dropped into them. Without this, a Droppable with
              // no children collapses to 0px and DnD treats it as invalid.
              minHeight: 8,
              backgroundColor: snapshot.isDraggingOver
                ? 'rgba(0,0,0,0.06)'
                : 'transparent',
              transition: 'background-color 0.15s ease',
              borderRadius: 1,
            }}
          >
            {sortedCards.map((card, index) => (
              <CardItem
                key={card.id}
                card={card}
                index={index}
                boardId={boardId}
                onClick={() => onCardClick?.(card)}
              />
            ))}

            {/*
             * MANDATORY placeholder: maintains the space that a dragged card
             * occupied so the list does not collapse during a drag.
             * Omitting this breaks drop-target sizing.
             */}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      {/* ── Add Card Form ─────────────────────────────────── */}
      <Box sx={{ px: 1, pb: 1.5 }}>
        <AddCardForm listId={list.id} boardId={boardId} />
      </Box>
    </Paper>
  );
};

export default ListColumn;
