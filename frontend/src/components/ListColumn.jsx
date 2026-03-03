import { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Popover,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaletteIcon from '@mui/icons-material/Palette';
import CardItem from './CardItem';
import AddCardForm from './AddCardForm';
import { useUpdateList } from '../hooks/useBoardDetail';

/**
 * ListColumn
 *
 * Renders a single board list as a vertical card column.
 * The entire card area is a @hello-pangea/dnd <Droppable>.
 *
 * Props:
 *   list      — { id: string, title: string, color: string | null, cards: Card[] }
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

// ── Palette constants ────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
  '#c377e0', '#0079bf', '#00c2e0', '#51e898',
  '#ff78cb', '#344563', '#4bbf6b', '#e04055',
];

// ── ListColumn ───────────────────────────────────────────────────────────────

const ListColumn = ({ list, boardId, onDelete, onCardClick, dragHandleProps, isDragging }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const titleInputRef = useRef(null);

  const updateListMutation = useUpdateList(boardId);

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

  // ── Color helpers ──────────────────────────────────────────────────────────

  const getBgColor = () => list.color ?? '#ebecf0';

  // Perceived-brightness formula: bright backgrounds → dark text, dark → white
  const getTextColor = () => {
    const hex = getBgColor().replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? 'rgba(0,0,0,0.7)' : '#ffffff';
  };

  // ── Title handlers ─────────────────────────────────────────────────────────

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
        backgroundColor: getBgColor(),
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
              color: getTextColor(),
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
              wordBreak: 'break-word',
            }}
          >
            {list.title}
          </Typography>
        )}

        <Tooltip title="Change color" placement="top">
          <IconButton
            size="small"
            onClick={(e) => setColorAnchorEl(e.currentTarget)}
            sx={{ flexShrink: 0, color: getTextColor() }}
          >
            <PaletteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete list" placement="top">
          <IconButton
            size="small"
            onClick={handleDeleteClick}
            sx={{ flexShrink: 0, color: getTextColor() }}
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

      {/* ── Color Picker Popover ──────────────────────────── */}
      <Popover
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={() => setColorAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 28px)', gap: 0.5 }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => {
                updateListMutation.mutate({ listId: list.id, data: { color: c } });
                setColorAnchorEl(null);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                backgroundColor: c,
                cursor: 'pointer',
                border: list.color === c ? '2px solid #fff' : '2px solid transparent',
                boxShadow: list.color === c ? '0 0 0 2px #0079bf' : 'none',
                '&:hover': { opacity: 0.85 },
              }}
            />
          ))}
          {/* Clear swatch */}
          <Box
            onClick={() => {
              updateListMutation.mutate({ listId: list.id, data: { color: null } });
              setColorAnchorEl(null);
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              backgroundColor: '#ebecf0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              color: 'text.secondary',
              border: !list.color ? '2px solid #0079bf' : '2px solid transparent',
              '&:hover': { opacity: 0.85 },
            }}
          >
            ✕
          </Box>
        </Box>
      </Popover>
    </Paper>
  );
};

export default ListColumn;
