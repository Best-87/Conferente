// install-service-worker.js
(function() {
  'use strict';
  
  // Verificar soporte para Service Worker
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker no soportado');
    return;
  }
  
  // Registrar Service Worker
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(registration) {
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          console.log('Nueva versión del Service Worker encontrada');
          
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nueva versión disponible
                showUpdateNotification(registration);
              } else {
                // Primer instalación
                console.log('Service Worker instalado por primera vez');
              }
            }
          });
        });
      })
      .catch(function(error) {
        console.log('Error registrando Service Worker:', error);
      });
    
    // Manejar actualizaciones
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
  
  // Mostrar notificación de actualización
  function showUpdateNotification(registration) {
    // Crear notificación en la interfaz
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      <i class="fas fa-sync-alt"></i>
      <div>
        <strong>¡Actualización disponible!</strong>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Recarga la página para usar la nueva versión.</p>
      </div>
      <button id="sw-reload-btn" style="
        background: white;
        color: #2563eb;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-left: 10px;
      ">Recargar</button>
      <button id="sw-dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        cursor: pointer;
      ">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Agregar estilos de animación
    if (!document.querySelector('#sw-animation')) {
      const style = document.createElement('style');
      style.id = 'sw-animation';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Configurar botones
    document.getElementById('sw-reload-btn').addEventListener('click', function() {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
      
      // Enviar mensaje al Service Worker para saltar la espera
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    
    document.getElementById('sw-dismiss-btn').addEventListener('click', function() {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    });
  }
})();