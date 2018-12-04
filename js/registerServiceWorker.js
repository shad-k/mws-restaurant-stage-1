activateServiceWorker = (worker) => {
  worker.postMessage({action: 'skipWaiting'});  
}

isServiceWorkerInstalling = (worker) => {
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      activateServiceWorker(worker);
    }
  });
}

registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('./sw.js').then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    if (reg.waiting) {
      console.log('SW waiting');
      activateServiceWorker(reg.waiting);
      return;
    }

    if (reg.installing) {
      console.log('SW installing');
      isServiceWorkerInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      console.log('SW updatefound');
      isServiceWorkerInstalling(reg.installing);
    });
  });

  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}