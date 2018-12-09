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
    
    this._db =  idb.open('restaurants', 4, (upgradeDb) => {

      switch(upgradeDb.oldVersion) {
        case 0:
          const store = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewStore.createIndex('restaurantId', 'restaurant_id');
        case 2:
          upgradeDb.createObjectStore('offlineReviews', {
            autoIncrement: true
          });
        case 3:
      }
    }, (e) => console.log(e));
    this._db.then((db) => {
      if(!db)
        return;

      const transaction = db.transaction('offlineReviews', 'readwrite');
      const offlineStore = transaction.objectStore('offlineReviews');
      offlineStore.openCursor().then(function submitAndDelete(review) {
        if(!review)
        return;
        DBHelper._submitReview(review.value).then((response) => {
          return response.json();
        }).then((review) => {
          DBHelper._updateReviews(review);
        });
        review.delete();
        review.continue().then(submitAndDelete);
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
        if(restaurant)
          return Promise.resolve(restaurant);
        else
          return Promise.reject();
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

  static _checkReviewsInIDB(id) {
    return this._db.then((db) => {
      if(!db)
        return Promise.reject();
      const transaction = db.transaction('reviews', 'readonly');
      const reviewStore = transaction.objectStore('reviews');
      const restaurantIndex = reviewStore.index('restaurantId');

      return restaurantIndex.getAll(parseInt(id)).then((reviews) => {
        if(typeof reviews !== 'undefined') {
          return Promise.resolve(reviews);
        }

        return Promise.reject();
      });
    });
  }

  static _getReviews(id, callback) {
    // fetch all restaurants with proper error handling.
    fetch( `http://localhost:1337/reviews/?restaurant_id=${id}` )
      .then( ( response ) => {
        if ( response.status === 200 )
          return response.json();
        else
          throw new Error( `Request failed. Returned status of ${response.status}` );
      } ).then( ( reviews ) => {
        this._db.then((db) => {
          if(!db)
            return;

          const transaction = db.transaction('reviews', 'readwrite');
          const store = transaction.objectStore('reviews');
          store.clear();
          reviews.forEach((review) => {
            store.put(review);
          });
        });
        if (callback)
          callback( null, reviews );
      } ).catch( ( error ) => {
        if(callback)
          callback( 'Restaurant does not exist', null );
        else
          console.log("Failed to fetch reviews for: ", id);
      } );
  }

  static fetchRestaurantReviews(id, callback) {
    const cachedReviews = DBHelper._checkReviewsInIDB(id);
    cachedReviews.then((reviews) => {
      DBHelper._getReviews(id);
      callback(null, reviews);
    }).catch((e) => {
      DBHelper._getReviews(id, callback);
    });
  }

  static _updateReviews(data) {
    this._db.then((db) => {
      if(!db)
        return;

      const transaction = db.transaction('reviews', 'readwrite');
      const reviewStore = transaction.objectStore('reviews');
      console.log(data);
      reviewStore.put(data);
      transaction.complete.then(() => {
        console.log('reload');
        window.location.reload();
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  static _submitOfflineReviews() {
    this._db.then((db) => {
      if(!db)
        return;

      const transaction = db.transaction('offlineReviews', 'readwrite');
      const offlineStore = transaction.objectStore('offlineReviews');

      offlineStore.openCursor().then(function submitAndDelete(review) {
        if(!review)
          return;
        DBHelper._submitReview(review.value).then((response) => {
          return response.json();
        }).then((review) => {
          DBHelper._updateReviews(review);
        });
        review.delete();
        return review.continue().then(submitAndDelete);
      });
    });
  }

  static _submitReview(data) {
    return fetch('http://localhost:1337/reviews/', {
      method: "POST",
      "headers": {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(data)
    });
  }

  static _attemptReviewSubmit(data) {
    DBHelper._submitReview(data).then((response) => {
      return response.json();
    }).then((review) => {
        console.log(review);
        DBHelper._updateReviews(review);
      }).catch((error) => {
        alert("You are offline, but your review will be saved locally for now and submitted once you get back online");
        this._db.then((db) => {
          if(!db)
            return;
        
          const transaction = db.transaction('offlineReviews', 'readwrite');
          const offlineStore = transaction.objectStore('offlineReviews');

          offlineStore.put(data);
        });
        window.addEventListener('online', () => DBHelper._submitOfflineReviews());
      });
  }

  static handleSubmit(event, id) {
    event.preventDefault();
    const name = event.target.name.value;
    const rating = event.target.rating.value;
    const comments = event.target.comments.value;

    const data = {
      restaurant_id: parseInt(id),
      name,
      rating,
      comments
    };

    DBHelper._attemptReviewSubmit(data);
  }

  static markFavorite(id, value) {
    let url;
    if(value) {
      url = `http://localhost:1337/restaurants/${id}/?is_favorite=true`;
    } else
      url = `http://localhost:1337/restaurants/${id}/?is_favorite=false`;
    fetch(url, {
      method: "PUT"
    }).then((response) => {
      return response.json();
    }).then((favorite) => {
      this._db.then((db) => {
        if(!db)
          return;

        const transaction =  db.transaction('restaurants', 'readwrite');
        const store = transaction.objectStore('restaurants');

        store.put(favorite);
      });
    });
  }
}
