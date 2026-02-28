import { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  LinearProgress,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import {
  useToggleChecklistItem,
  useDeleteChecklist,
  useCreateChecklistItem,
  useDeleteChecklistItem,
} from '../hooks/useCardDetail';

/**
 * ChecklistSection
 *
 * Renders a single checklist: title, linear progress bar, list of items with
 * checkboxes, an inline "Add item" form, and a delete button for the whole checklist.
 *
 * Props:
 *   checklist — {
 *     id: string,
 *     title: string,
 *     ChecklistItems: Array<{ id: string, content: string, is_checked: boolean }>
 *   }
 *   cardId — string — parent card ID (needed for query invalidation)
 */
const ChecklistSection = ({ checklist, cardId }) => {
  const [addingItem, setAddingItem] = useState(false);
  const [newItemContent, setNewItemContent] = useState('');

  const items = Array.isArray(checklist.ChecklistItems) ? checklist.ChecklistItems : [];
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.is_checked).length;
  const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  const toggleItem = useToggleChecklistItem(cardId);
  const deleteChecklist = useDeleteChecklist(cardId);
  const createItem = useCreateChecklistItem(cardId);
  const deleteItem = useDeleteChecklistItem(cardId);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggle = (item) => {
    toggleItem.mutate({ itemId: item.id, data: { is_checked: !item.is_checked } });
  };

  const handleDeleteChecklist = () => {
    deleteChecklist.mutate(checklist.id);
  };

  const handleAddItem = () => {
    if (!newItemContent.trim()) return;
    createItem.mutate(
      { checklistId: checklist.id, content: newItemContent.trim() },
      {
        onSuccess: () => {
          setNewItemContent('');
          setAddingItem(false);
        },
      }
    );
  };

  const handleAddItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
    if (e.key === 'Escape') {
      setAddingItem(false);
      setNewItemContent('');
    }
  };

  const handleDeleteItem = (itemId) => {
    deleteItem.mutate(itemId);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ mb: 3 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {checklist.title}
        </Typography>

        <Tooltip title="Delete checklist">
          <span>
            <IconButton
              size="small"
              onClick={handleDeleteChecklist}
              disabled={deleteChecklist.isPending}
              aria-label="Delete checklist"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ── Progress bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
          {progress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: progress === 100 ? 'success.main' : 'primary.main',
            },
          }}
        />
      </Box>

      {/* ── Items ── */}
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem
            key={item.id}
            disablePadding
            secondaryAction={
              <Tooltip title="Delete item">
                <span>
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={
                      deleteItem.isPending && deleteItem.variables === item.id
                    }
                    aria-label="Delete checklist item"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            }
            sx={{
              '&:hover': { backgroundColor: 'action.hover', borderRadius: 1 },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox
                size="small"
                checked={Boolean(item.is_checked)}
                onChange={() => handleToggle(item)}
                disabled={
                  toggleItem.isPending &&
                  toggleItem.variables?.itemId === item.id
                }
                sx={{ p: 0.5 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={item.content}
              primaryTypographyProps={{
                variant: 'body2',
                sx: {
                  textDecoration: item.is_checked ? 'line-through' : 'none',
                  color: item.is_checked ? 'text.disabled' : 'text.primary',
                  transition: 'color 0.15s ease, text-decoration 0.15s ease',
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* ── Add item form ── */}
      {addingItem ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            placeholder="Add an item"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={handleAddItemKeyDown}
            autoFocus
            fullWidth
            disabled={createItem.isPending}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleAddItem}
              disabled={createItem.isPending || !newItemContent.trim()}
            >
              {createItem.isPending ? 'Adding…' : 'Add'}
            </Button>
            <Button
              size="small"
              onClick={() => {
                setAddingItem(false);
                setNewItemContent('');
              }}
              disabled={createItem.isPending}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddingItem(true)}
          sx={{ mt: 0.5 }}
        >
          Add item
        </Button>
      )}
    </Box>
  );
};

export default ChecklistSection;
