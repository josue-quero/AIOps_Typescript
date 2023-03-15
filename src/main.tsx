import ReactDOM from 'react-dom/client';
import 'index.css';
import App from 'App';
import { AuthContextProvider } from 'context/auth-context';
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AuthContextProvider>
    <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  </AuthContextProvider>
);