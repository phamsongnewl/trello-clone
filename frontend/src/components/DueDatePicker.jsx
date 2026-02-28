import { useState } from 'react';
import { Box, Chip, Button, TextField, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, isPast, isToday, parseISO, isWithinInterval, addHours } from 'date-fns';

/**
 * DueDatePicker
 *
 * Displays the card's due date as a colour-coded chip.
 * Clicking the chip (or the "Add due date" button) reveals an HTML date input
 * and a Save button.
 *
 * Colour rules:
 *   red    — past due (strictly before today)
 *   yellow — due today, or within the next 24 hours
 *   green  — due later
 *
 * Props:
 *   cardId   — string   — used only if the parent passes a standalone mutation
 *   dueDate  — string | null — ISO date string (e.g. "2026-04-01")
 *   onUpdate — (isoDateString | null) => void — called with new value on Save,
 *              or with null when the user clears the date
 *   disabled — boolean (optional) — disables all interaction while saving
 */
const DueDatePicker = ({ dueDate, onUpdate, disabled = false }) => {
  const [editing, setEditing] = useState(false);
  // HTML date input expects "YYYY-MM-DD"
  const [inputValue, setInputValue] = useState(
    dueDate ? dueDate.slice(0, 10) : ''
  );

  // ── Colour logic ─────────────────────────────────────────────────────────
  let chipColor = 'success';
  let chipLabel = '';

  if (dueDate) {
    const date = parseISO(dueDate);
    chipLabel = format(date, 'MMM d, yyyy');

    if (isPast(date) && !isToday(date)) {
      chipColor = 'error';
    } else if (
      isToday(date) ||
      isWithinInterval(date, { start: new Date(), end: addHours(new Date(), 24) })
    ) {
      chipColor = 'warning';
    } else {
      chipColor = 'success';
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    onUpdate(inputValue || null);
    setEditing(false);
  };

  const handleCancel = () => {
    setInputValue(dueDate ? dueDate.slice(0, 10) : '');
    setEditing(false);
  };

  const handleClear = () => {
    setInputValue('');
    onUpdate(null);
    setEditing(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        Due Date
      </Typography>

      {!editing ? (
        <Box sx={{ mt: 0.5 }}>
          {dueDate ? (
            <Chip
              icon={<AccessTimeIcon />}
              label={chipLabel}
              color={chipColor}
              onClick={() => !disabled && setEditing(true)}
              onDelete={!disabled ? handleClear : undefined}
              sx={{ cursor: disabled ? 'default' : 'pointer', fontWeight: 600 }}
            />
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setEditing(true)}
              disabled={disabled}
              startIcon={<AccessTimeIcon />}
            >
              Add due date
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            size="small"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            inputProps={{ 'aria-label': 'Due date' }}
            sx={{ width: 160 }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={disabled}
          >
            Save
          </Button>
          <Button size="small" onClick={handleCancel} disabled={disabled}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DueDatePicker;
