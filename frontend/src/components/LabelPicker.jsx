import { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { useBoardLabels, useCreateLabel, useAddLabel, useRemoveLabel } from '../hooks/useCardDetail';

// ── Eight preset colours for new labels ──────────────────────────────────────
const PRESET_COLORS = [
  '#61bd4f', // green
  '#f2d600', // yellow
  '#ff9f1a', // orange
  '#eb5a46', // red
  '#c377e0', // purple
  '#0079bf', // blue
  '#00c2e0', // sky
  '#ff78cb', // pink
];

/**
 * LabelPicker
 *
 * Displays all labels that belong to the board. Labels already attached to the
 * card show a checkmark. Clicking any label toggles it on/off.
 * A "Create label" sub-form lets users add new labels with a name and one of
 * the 8 preset colours.
 *
 * Props:
 *   cardId     — string    — the card being edited
 *   boardId    — string    — the board whose labels are shown
 *   cardLabels — Label[]   — labels currently attached to the card
 *                            (Label: { id, name, color })
 */
const LabelPicker = ({ cardId, boardId, cardLabels = [] }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const { data: boardLabels = [], isPending: labelsLoading } = useBoardLabels(boardId);
  const addLabel = useAddLabel(cardId);
  const removeLabel = useRemoveLabel(cardId);
  const createLabel = useCreateLabel(boardId);

  const attachedIds = new Set((cardLabels || []).map((l) => String(l.id)));

  const handleToggle = (label) => {
    if (attachedIds.has(String(label.id))) {
      removeLabel.mutate(label.id);
    } else {
      addLabel.mutate(label.id);
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createLabel.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName('');
          setNewColor(PRESET_COLORS[0]);
          setShowCreateForm(false);
        },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        Labels
      </Typography>

      {labelsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <List dense disablePadding sx={{ mt: 0.5 }}>
          {boardLabels.length === 0 && (
            <ListItem disablePadding>
              <ListItemText
                primary="No labels on this board yet."
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}

          {boardLabels.map((label) => {
            const isAttached = attachedIds.has(String(label.id));
            const isMutating =
              (addLabel.isPending && addLabel.variables === label.id) ||
              (removeLabel.isPending && removeLabel.variables === label.id);

            return (
              <ListItem key={label.id} disablePadding>
                <ListItemButton
                  onClick={() => handleToggle(label)}
                  disabled={isMutating}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  {/* Colour swatch */}
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 18,
                        borderRadius: 0.75,
                        backgroundColor: label.color || 'grey.400',
                      }}
                    />
                  </ListItemIcon>

                  <ListItemText
                    primary={label.name || '(no name)'}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />

                  {/* Checkmark when attached */}
                  {isAttached && (
                    <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      <Divider sx={{ my: 1 }} />

      {/* ── Create label sub-form ───────────────────────────────────────── */}
      {!showCreateForm ? (
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Create label
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
          <TextField
            label="Label name"
            size="small"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            autoFocus
          />

          {/* Colour swatches */}
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((color) => (
              <Tooltip key={color} title={color} arrow>
                <Box
                  onClick={() => setNewColor(color)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 0.75,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: newColor === color ? '3px solid' : '2px solid transparent',
                    borderColor: newColor === color ? 'primary.main' : 'transparent',
                    boxSizing: 'border-box',
                    transition: 'border 0.12s ease',
                  }}
                />
              </Tooltip>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleCreate}
              disabled={createLabel.isPending || !newName.trim()}
            >
              {createLabel.isPending ? 'Creating…' : 'Create'}
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowCreateForm(false);
                setNewName('');
                setNewColor(PRESET_COLORS[0]);
              }}
              disabled={createLabel.isPending}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LabelPicker;
