skipMapFocus = () => {
  const topHeader = document.querySelector('header nav h1 a');
  const neighborhoodSelect = document.getElementById( 'neighborhoods-select' );

  if ( topHeader ) {
    topHeader.addEventListener( 'keydown', ( event ) => {
      event.preventDefault();
      if(event.keyCode !== 9)
      return;
      neighborhoodSelect.focus();
    });
  }

  if ( neighborhoodSelect ) {
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
}

skipRestaurantMapFocus = () => {
  const restaurantName = document.getElementById( 'restaurant-name' );
  const reviewHeader = document.querySelector( '#reviews-container h2' );

  restaurantName.addEventListener( 'keydown', ( event ) => {
    if ( event.keyCode !== 9 )
      return;
    
    event.preventDefault();
    reviewHeader.focus();
  } );

  reviewHeader.addEventListener( 'keydown', ( event ) => {
    if ( event.keyCode !== 9 ) {
      return;
    }
    if ( event.shiftKey ) {
      event.preventDefault();
      restaurantName.focus();
    }
    else
      return;
  } );
}