import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { register } from '../api/auth';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name.trim()) return 'Name is required.';
    if (!email.trim() || !email.includes('@')) return 'A valid email is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);
    try {
      await register(name, email, password);
      navigate('/login');
    } catch (err) {
      const message =
        err.response?.data?.message ?? 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* Heading */}
          <Typography variant="h5" fontWeight={700} align="center" mb={3}>
            Create your account
          </Typography>

          {/* Error alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              autoComplete="name"
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
              helperText="Minimum 6 characters"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isPending}
              sx={{ py: 1.25, fontWeight: 600 }}
            >
              {isPending ? 'Creating account…' : 'Sign Up'}
            </Button>
          </Box>

          {/* Login link */}
          <Typography align="center" variant="body2" mt={2}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Log in
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
