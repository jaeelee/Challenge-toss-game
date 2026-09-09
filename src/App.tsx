import { BrowserRouter, Route, Routes } from 'react-router-dom';

import '/App.css';

import { Board } from '/pages/game-board';
import { Home } from '/pages/home';

function App() {
  return (
    <div className="wrap">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Board />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
