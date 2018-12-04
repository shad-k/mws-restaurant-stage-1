skipMapFocus = () => {
  
  const topHeader = document.querySelector('header nav h1 a');
  const neighborhoodSelect = document.getElementById('neighborhoods-select');
  topHeader.addEventListener('keydown', (event) => {
    event.preventDefault();
    if(event.keyCode !== 9)
      return;
    neighborhoodSelect.focus();
  });

  neighborhoodSelect.addEventListener('keydown', (event) => {
    if(event.keyCode !== 9) {
      return;
    }
    if(event.shiftKey) {
      event.preventDefault();
      topHeader.focus();
    }
    else
      return;
  });
}