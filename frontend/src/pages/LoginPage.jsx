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
import { useAuth } from '../store/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error,     setError]     = useState('');
  const [errorType, setErrorType] = useState('error'); // 'error' | 'warning'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('error');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsPending(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        setErrorType('warning');
        setError(
          err.response.data?.message ??
          'Your account is not activated yet. Please contact admin.'
        );
      } else {
        setErrorType('error');
        setError(
          err.response?.data?.message ?? 'Login failed. Please try again.'
        );
      }
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
          <Typography variant="h5" fontWeight={700} align="center" mb={3}>
            Log in to Trello App
          </Typography>

          {error && (
            <Alert severity={errorType} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isPending}
              sx={{ py: 1.25, fontWeight: 600 }}
            >
              {isPending ? 'Logging in…' : 'Log In'}
            </Button>
          </Box>

          <Typography align="center" variant="body2" mt={2}>
            Don&apos;t have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
