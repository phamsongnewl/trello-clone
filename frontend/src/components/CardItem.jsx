import { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, isPast, isToday, parseISO } from 'date-fns';
import CardModal from './CardModal';

/**
 * CardItem
 *
 * A draggable card tile rendered inside a ListColumn's Droppable.
 *
 * Props:
 *   card    — { id: string, title: string, due_date?: string, Labels?: Label[] }
 *   index   — position in the Droppable list (required by @hello-pangea/dnd)
 *   boardId — string — parent board ID, passed down to CardModal for label picker
 *             and board-level query invalidation
 *   onClick — optional external callback (kept for backwards compatibility;
 *             if provided it is called IN ADDITION to opening the modal)
 *
 * CRITICAL: draggableId must be a string. card.id is a UUID string — OK.
 */
const CardItem = memo(({ card, index, boardId, onClick }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const hasLabels = Array.isArray(card.Labels) && card.Labels.length > 0;
  const hasDueDate = Boolean(card.due_date);

  // Due date display logic
  let dueDateLabel = null;
  let dueDateColor = 'default';
  if (hasDueDate) {
    const date = parseISO(card.due_date);
    dueDateLabel = format(date, 'MMM d');
    if (isPast(date) && !isToday(date)) {
      dueDateColor = 'error';
    } else if (isToday(date)) {
      dueDateColor = 'warning';
    }
  }

  const handleCardClick = () => {
    setModalOpen(true);
    if (onClick) onClick(card);
  };

  return (
    <>
      <Draggable draggableId={String(card.id)} index={index}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            elevation={snapshot.isDragging ? 6 : 1}
            onClick={handleCardClick}
            sx={{
              p: 1.25,
              mb: 1,
              borderRadius: 1.5,
              cursor: 'pointer',
              backgroundColor: snapshot.isDragging ? 'primary.light' : 'background.paper',
              boxShadow: snapshot.isDragging
                ? '0 8px 24px rgba(0,0,0,0.18)'
                : undefined,
              transition: 'box-shadow 0.15s ease, background-color 0.15s ease',
              '&:hover': {
                backgroundColor: snapshot.isDragging ? 'primary.light' : 'grey.50',
              },
              userSelect: 'none',
            }}
          >
            {/* Label chips row */}
            {hasLabels && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                {card.Labels.map((label) => (
                  <Tooltip key={label.id} title={label.name || ''} arrow>
                    <Box
                      sx={{
                        width: 40,
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: label.color || 'grey.400',
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}

            {/* Card title */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}
            >
              {card.title}
            </Typography>

            {/* Footer: due date */}
            {hasDueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.75 }}>
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important' }} />}
                  label={dueDateLabel}
                  size="small"
                  color={dueDateColor}
                  variant={dueDateColor === 'default' ? 'outlined' : 'filled'}
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Draggable>

      {/* Card detail modal — rendered outside the Draggable to avoid DnD interference */}
      <CardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cardId={card.id}
        boardId={boardId}
      />
    </>
  );
});

CardItem.displayName = 'CardItem';

export default CardItem;
