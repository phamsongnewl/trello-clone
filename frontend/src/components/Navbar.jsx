import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../store/AuthContext';

/**
 * Returns up to two uppercase initials from a display name.
 * e.g. "Jane Doe" → "JD", "Alice" → "A"
 */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const initials = getInitials(user?.name ?? user?.email ?? '');

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{ bgcolor: 'primary.main', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        {/* Logo / brand name */}
        <Typography
          variant="h6"
          fontWeight={700}
          letterSpacing={0.5}
          sx={{ flexGrow: 1, userSelect: 'none' }}
        >
          Trello App
        </Typography>

        {/* Avatar — opens dropdown menu */}
        <Tooltip title={user?.name ?? user?.email ?? 'Account'}>
          <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 36,
                height: 36,
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Log out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
