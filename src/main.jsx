import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { MOUNT_ID } from './config.js';
import './styles.css';

const node = document.getElementById(MOUNT_ID);
if (!node) throw new Error(`Mount node #${MOUNT_ID} not found`);
createRoot(node).render(<App />);
