/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  static setupIDB() {
    if(!navigator.serviceWorker)
      return Promise.resolve();
    
    this._db =  idb.open('restaurants', 1, (upgradeDb) => {
      const store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });

    return this._db;
  }

  static _checkIDB() {
    return this._db.then((db) => {
      if(!db)
        return Promise.reject(false);

      const transaction = db.transaction('restaurants', 'readonly');
      const store = transaction.objectStore('restaurants');

      return store.getAll().then((restaurants) => {
        return Promise.resolve(restaurants);
      });
    });
  }

  static _fetchAndUpdateRestaurants(callback) {
    fetch( 'http://localhost:1337/restaurants' )
      .then( ( response ) => {
        if ( response.status === 200 )
          return response.json();
        else
          throw new Error( `Request failed. Returned status of ${response.status}` );
      } ).then( ( restaurants) => {
        // Empty the idb and re-enter the json data
        this._db.then((db) => {
          if(!db) return;

          const transaction = db.transaction('restaurants', 'readwrite');
          const store = transaction.objectStore('restaurants');

          store.clear();

          restaurants.forEach((restaurant) => {
            store.put(restaurant);
          });
        });
        if(callback)
          callback( null, restaurants );
      } ).catch( ( error ) => {
        if(callback)
          callback( error, null );
        else
          console.log("Something went wrong: ", error);
      })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants( callback ) {
    const cachedJSON = DBHelper._checkIDB();
    cachedJSON.then((restaurants) => {
      if(restaurants.length > 0) {
        DBHelper._fetchAndUpdateRestaurants();
        callback(null, restaurants);
        return Promise.resolve();
      } else {
        throw new Error("No restaurants found");
      }
    }).catch((e) => {
      DBHelper._fetchAndUpdateRestaurants(callback);
    });
  }

  static _checkRestaurantInIDB(id) {
    return this._db.then((db) => {
      if(!db)
        return Promise.reject();
      const transaction = db.transaction('restaurants', 'readonly');
      const store = transaction.objectStore('restaurants');
      return store.get(parseInt(id)).then((restaurant) => {
        return Promise.resolve(restaurant);
      }).catch(() => {
        return Promise.reject();
      });
    })
  }

  static _getRestaurant(id, callback) {
    // fetch all restaurants with proper error handling.
    fetch( `http://localhost:1337/restaurants/${id}` )
      .then( ( response ) => {
        if ( response.status === 200 )
          return response.json();
        else
          throw new Error( `Request failed. Returned status of ${response.status}` );
      } ).then( ( restaurant ) => {
        this._db.then((db) => {
          if(!db)
            return;

          const transaction = db.transaction('restaurants', 'readwrite');
          const store = transaction.objectStore('restaurants');
          
          store.put(restaurant);
        });
        if (callback)
          callback( null, restaurant );
      } ).catch( ( error ) => {
        if(callback)
          callback( 'Restaurant does not exist', null );
        else
          console.log("Failed to fetch restaurant: ", id);
      } );
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    const cachedJSON = DBHelper._checkRestaurantInIDB(id);
    cachedJSON.then((restaurant) => {
      DBHelper._getRestaurant(id);
      callback(null, restaurant);
    }).catch((e) => {
      DBHelper._getRestaurant(id, callback);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`dist/img/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      keyboard: false
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

