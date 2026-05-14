import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">PhysioFlow</h1>
        <p className="text-lg text-gray-700">Frontend scaffolding is complete. React, Vite, Tailwind, Zustand, and React Router are ready.</p>
      </div>
    </BrowserRouter>
  );
}

export default App;
