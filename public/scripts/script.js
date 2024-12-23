function main(username, ulat, ulon) {
  const clientList = document.querySelector("#clients");
  const warnings = document.querySelector('.warnings')
  const bottomCard = document.querySelector(".bottom-card");
  const mylatlon = document.querySelector(".my-latlon");
  const view = document.querySelector(".view");
  const viewContainer = document.querySelector(".view-container");
  const myposition = document.querySelector(".myposition")
  const recomends = document.querySelector('.recomends')
  
  let socket = io();

  // initializing
  let map = L.map("map").setView([ulat, ulon], 14);
  map.on('click', mapClick);
  console.log(ulat, ulon);


  socket.emit("client-join-location", {
    lat: ulat,
    lon: ulon,
    username: username,
  });
  // notify user join
  socket.on("client-join-server", (data) => {
    joinToast(
      `${data.username ? data.username : data.id} has joined to the map!`
    );
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 20,
            attribution:
            '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a traget="_blank" href="https://github.com/faisal-shohag/realtime_location_tracking">faisal-shohag</a>',
   }).addTo(map);

  //Map tile layer
  viewContainer.addEventListener('click', (e)=>{
    if(e.target.id === 'sat') {
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 20,
            attribution:
            '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a traget="_blank" href="https://github.com/faisal-shohag/realtime_location_tracking">faisal-shohag</a>',
        }).addTo(map);
     viewContainer.innerHTML = '<div class="street view" id="str"></div>'

    }else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 20,
            attribution:
            '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a traget="_blank" href="https://github.com/faisal-shohag/realtime_location_tracking">faisal-shohag</a>',
        }).addTo(map);
        viewContainer.innerHTML = '<div class="satellite view" id="sat"></div>'       
    }
  })
  

  let liveSetView = false;
  let present_destination;
  myposition.addEventListener('click', ()=>{map.setView(present_destination, 17); window.history.back()})


  ok = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const acc = position.coords.accuracy;
    present_destination = [lat, lon];
    if (liveSetView) {
      map.setView([data.lat, data.lon], 14);
    }
    socket.emit("client-location", { lat, lon, acc, username: username, platform: platform.description});
    mylatlon.innerHTML = `Lat: ${lat} Lon: ${lon}`;
    
  
    // bottomCard.innerHTML = `
    //     <div class="distance">${
    //       distance < 1
    //         ? (distance * 1000).toFixed(2) + "<span>M</span>"
    //         : distance.toFixed(2) + "<span>KM</span>"
    //     }</div>
    //     <div class="location">BRUR Campus</div>
    //     `;
    // getLocationByLatLon(lat, lon)
    // .then(address => {
    //     address = address+','
    //     locationName = address.split(',')[0]
    //     mylatlon.innerHTML += `<br>${locationName}`
    //     // console.log(locationName)
    // })
  };


  error = (err) => {
    err.code == 1
      ? console.log("Please alllow location service from your device!")
      : console.log("Something went wrong!", err);
  };

  options = {
    enableHighAccuracy: true,
    timeout: 3000,
  };

  navigator.geolocation.watchPosition(ok, error, options);

  let d = 100;
  let polylineGroup = L.layerGroup().addTo(map)
  // Realtime user navigation
  let connected_users = {};
  let updateMap = () => {
    clientList.innerHTML = ``;
    warnings.innerHTML = ``
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    polylineGroup.clearLayers()

    for (let key in connected_users) {
      if (connected_users.hasOwnProperty(key)) {
        connected_users[key].pointMarker();
        clientList.innerHTML += `
            <div class="client-card">
            <div class="id">${connected_users[key].username}</div>
            <div class="platform">From <span>${connected_users[key].platform}</span></div>
            <div class="latlon">Lat: ${connected_users[key].lat} | Lon: ${
          connected_users[key].lon
        }</div>
            `;
      }
    }
  };

  socket.on("server-location", (data) => {
    connected_users[data.id] = {
      lat: data.lat,
      lon: data.lon,
      acc: data.acc,
      username: data.username,
      platform: data.platform,
      pointMarker: function () {
        marker = L.marker([data.lat, data.lon])
          .addTo(map)
          .bindTooltip(data.username ? data.username : data.id, {
            parmanent: true,
            direction: "top",
          })
          .openTooltip();
      },
    };
    updateMap();
  });

  socket.on("disconnected_user", (data) => {
    delete connected_users[data.id];
    updateMap();
    leftToast(
      `${data.username ? data.username : data.id} has left from the map!`
    );
  });
}
