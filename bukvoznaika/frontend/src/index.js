import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Регистрируем service worker для офлайн-работы
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('Service worker зарегистрирован:', reg.scope))
      .catch((err) => console.log('Ошибка регистрации service worker:', err));
  });
}
