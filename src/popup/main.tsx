import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import './popup.css';

const root = document.getElementById('root');
if (!root) throw new Error('Popup root is missing.');
createRoot(root).render(<PopupApp />);
