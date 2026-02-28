import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';

/**
 * @param {{ board: { id: number|string, title: string, background_color: string } }} props
 */
export default function BoardCard({ board }) {
  const navigate = useNavigate();

  return (
    <Card
      elevation={2}
      sx={{
        bgcolor: board.background_color,
        borderRadius: 2,
        height: 100,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/boards/${board.id}`)}
        sx={{ height: '100%', alignItems: 'flex-start' }}
      >
        <CardContent>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {board.title}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
