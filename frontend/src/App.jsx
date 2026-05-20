import { HashRouter, Routes, Route } from 'react-router-dom';
import StoreFront from './StoreFront';
import { KitchenView } from './components/KitchenView';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<StoreFront />} />
        <Route path="/cocina" element={<KitchenView />} />
      </Routes>
    </HashRouter>
  );
}

export default App;