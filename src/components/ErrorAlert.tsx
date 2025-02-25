import { Alert, Snackbar } from '@mui/material';

interface ErrorAlertProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function ErrorAlert({ open, message, onClose }: ErrorAlertProps) {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
