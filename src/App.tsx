import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './App.css'; // Optional if you have global custom css, otherwise can be removed

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
