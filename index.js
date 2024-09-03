let map, service, infoWindow, marker;
let placesArray = [];

function initMap() {
    const mapOptions = {
        center: { lat: 4.2105, lng: 101.9758 }, // Focus on Malaysia
        zoom: 6
    };

    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    map.addListener('click', (event) => {
        addMarker(event.latLng.lat(), event.latLng.lng());
    });

    const searchInput = document.getElementById('place-input');
    const autocomplete = new google.maps.places.Autocomplete(searchInput);
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            addMarker(place.geometry.location.lat(), place.geometry.location.lng());
            fetchPlaceDetails(place.place_id);  // Fetch place details on autocomplete selection
        }
    });
}

function addMarker(lat, lng) {
    if (marker) {
        marker.setMap(null); // Remove the previous marker from the map
    }

    marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        draggable: true
    });

    marker.addListener('dragend', (event) => {
        const updatedLatLng = event.latLng;
        reverseGeocode(updatedLatLng);
    });
}

function reverseGeocode(latLng) {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            console.log(`Location: ${results[0].formatted_address}`);
        }
    });
}

function searchPlace() {
    const searchInput = document.getElementById('place-input').value;

    const request = {
        query: searchInput,
        fields: ['place_id', 'name', 'formatted_address', 'geometry'] // Request basic details
    };

    service = new google.maps.places.PlacesService(map);
    service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const placeId = results[0].place_id;
            fetchPlaceDetails(placeId); // Fetch detailed information including reviews
        } else {
            alert('No places found.');
        }
    });
}

function fetchPlaceDetails(placeId) {
    const request = {
        placeId: placeId,
        fields: ['name', 'rating', 'user_ratings_total', 'reviews', 'formatted_address', 'geometry']
    };

    service = new google.maps.places.PlacesService(map);
    service.getDetails(request, handleResults); // Handle results in the same way
}



function searchNearby() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            const request = {
                location: userLocation,
                radius: '1500',
                type: ['establishment'],
            };

            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, handleResults);
        });
    } else {
        alert("Geolocation not supported by this browser.");
    }
}

function handleResults(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log('Results:', results);
        placesArray = Array.isArray(results) ? results : []; // Ensure it's an array
        console.log('Places Array:', placesArray);
        displayPlaces(placesArray);
    } else {
        console.error('Error in handling results:', status);
    }
}


function displayPlaces(places) {
    if (!Array.isArray(places)) {
        console.error('Expected an array of places.');
        return;
    }

    const placesList = document.getElementById("places-list");
    placesList.innerHTML = '';

    places.forEach((place) => {
        let reviewsHtml = '';
        if (place.reviews) {
            reviewsHtml = place.reviews.map(review => `
                <div>
                    <p><strong>${review.author_name}</strong>: ${review.text}</p>
                    <p>Rating: ${review.rating}</p>
                </div>
            `).join('');
        }

        placesList.innerHTML += `
            <div>
                <h4>${place.name}</h4>
                <p>Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</p>
                <p>Address: ${place.formatted_address || 'N/A'}</p>
                <div>${reviewsHtml}</div>
            </div>
        `;
    });
}



function sortByReviews() {
    placesArray.sort((a, b) => b.user_ratings_total - a.user_ratings_total);
    displayPlaces(placesArray);
}

// Initialize the map on window load
window.onload = initMap;
