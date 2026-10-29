import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><main><h1>Practice Pads</h1><p>Practice workspace coming soon.</p></main></StrictMode>,
);
