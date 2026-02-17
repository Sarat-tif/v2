mapboxgl.accessToken =
  "pk.eyJ1Ijoic2FyYXRoMDUiLCJhIjoiY21rY2t4ZHdvMDFsaTNkczZ1ejYxdWhyaSJ9.heHSbxWlluPh16ZcQB_nDQ";

// Mapbox styles
const NHS = "mapbox://styles/sarath05/cmljtu6u3003401s980hngb56";
const hotspot = "mapbox://styles/sarath05/cmlpt21xl000n01rzct24hb3x";
const trans_hub = "mapbox://styles/sarath05/cmlpx81dl005201sactpbarx9";
const spa = "mapbox://styles/sarath05/cmlpvfp2q005101sa8sk91x97";
const cw = "mapbox://styles/sarath05/cmlpoul6d000i01qr7v6qef09";

const data_url =
  "https://api.mapbox.com/datasets/v1/sarath05/cmlq90se10abk1nmq1mvnnmfj/features?access_token=" +
  mapboxgl.accessToken;

// Create map
const map = new mapboxgl.Map({
  container: "map",
  style: NHS,
  center: [-4.2518, 55.8642],
  zoom: 10.6
});

// ------------------------------
// ADD CONTROLS ON MAP LOAD
// ------------------------------
map.on("load", () => {

    // Navigation + Geolocate
    map.addControl(new mapboxgl.NavigationControl(), "bottom-left");
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }),
        "bottom-left"
    );

    
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Search places in Glasgow",
        proximity: { longitude: -4.2518, latitude: 55.8642 }
    });

    geocoder.addTo("#geocoder-container");

    
    geocoder.on("result", (e) => {
        const coords = e.result.center;

        map.flyTo({
            center: coords,
            zoom: 7,
            speed: 0.8,
            curve: 1.0,
            essential: true
        });
    });
   

    // Auto user location
    setTimeout(autoGetUserLocation, 500);
});

// ------------------------------
// STYLE LOAD → ADD DATASET + HOVER POPUP
// ------------------------------
let hoverPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  offset: [0, -10]
});

map.on("style.load", () => {
  // Add dataset source if missing
  if (!map.getSource("locations")) {
    map.addSource("locations", {
      type: "geojson",
      data: data_url
    });
  }

  // Add invisible circle layer
  if (!map.getLayer("locations")) {
    map.addLayer({
      id: "locations",
      type: "circle",
      source: "locations",
      paint: {
        "circle-radius": 1.5,
        "circle-color": "#22c55e",
        "circle-opacity": 0.0
      }
    });
  }

  // Hover popup
  map.on("mouseenter", "locations", (e) => {
    map.getCanvas().style.cursor = "pointer";

    const feature = e.features[0];
    const coords = feature.geometry.coordinates.slice();
    const props = feature.properties;

    const title = props.Name || "Unknown";
    const type = props.Type || "";

    hoverPopup
      .setLngLat(coords)
      .setHTML(`<strong>${title}</strong><br/><em>${type}</em>`)
      .addTo(map);
  });

  map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
    hoverPopup.remove();
  });
});

// ------------------------------
// RADIO BUTTON STYLE SWITCHER
// ------------------------------
const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");

function updateActiveRadioLabel() {
  const labels = layerList.getElementsByClassName("container");
  for (const label of labels) {
    const radio = label.querySelector("input");
    label.classList.toggle("container-active", radio.checked);
  }
}

updateActiveRadioLabel();

for (const input of inputs) {
  input.onclick = (e) => {
    const id = e.target.id;

    if (id === "NHS") map.setStyle(NHS);
    if (id === "hotspot") map.setStyle(hotspot);
    if (id === "cw") map.setStyle(cw);
    if (id === "spa") map.setStyle(spa);
    if (id === "trans_hub") map.setStyle(trans_hub);

    updateActiveRadioLabel();
  };
}

// ------------------------------
// AUTO USER LOCATION MARKER
// ------------------------------
let userMarker;
let isLocating = false;

async function autoGetUserLocation() {
  const coordsDiv = document.getElementById("coords");
  coordsDiv.innerHTML = `<div id="loading">📍 Detecting your location...</div>`;

  if (!navigator.geolocation || isLocating) return;
  isLocating = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      const loading = document.getElementById("loading");
      if (loading) loading.remove();

      if (userMarker) userMarker.remove();

      const markerEl = document.createElement("div");
      markerEl.style.cssText = `
        width: 44px; height: 52px;
        cursor: pointer; transition: 0.3s;
        filter: drop-shadow(0 8px 24px rgba(229, 39, 58, 0.6));
      `;

      markerEl.innerHTML = `YOUR SVG HERE`;

      userMarker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([longitude, latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setText(
            `Your Location\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          )
        )
        .addTo(map);

      isLocating = false;
    },
    () => {
      coordsDiv.innerHTML = `<div style="color:#f87171;">📍 Location access denied</div>`;
      isLocating = false;
    }
  );
}