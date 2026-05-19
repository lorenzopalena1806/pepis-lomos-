import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreFront from './StoreFront';
import KitchenView from './components/KitchenView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StoreFront />} />
        <Route path="/cocina" element={<KitchenView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
