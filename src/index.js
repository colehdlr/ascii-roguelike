import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

// Use createRoot instead of ReactDOM.render
const rootContainer = document.getElementById('root');
const root = createRoot(rootContainer);
root.render(<App />);

