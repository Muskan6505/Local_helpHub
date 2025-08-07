import React, { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "react-toastify";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const LocationPicker = ({ lat, lng, address, setLocation }) => {
  const [markerPosition, setMarkerPosition] = useState({
    lat: lat || defaultCenter.lat,
    lng: lng || defaultCenter.lng,
  });

  const mapRef = useRef(null);
  const autoCompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (lat && lng) {
      setMarkerPosition({ lat, lng });
    }
  }, [lat, lng]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerDragEnd = async (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPosition({ lat: newLat, lng: newLng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`
      );
      const data = await res.json();
      const address = data.display_name;

      setLocation({
        lat: newLat,
        lng: newLng,
        address,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch address");
    }
  };

  const handlePlaceSelect = () => {
    const place = autoCompleteRef.current.getPlace();
    if (!place.geometry || !place.geometry.location) return;

    const newLat = place.geometry.location.lat();
    const newLng = place.geometry.location.lng();
    const address = place.formatted_address;

    setMarkerPosition({ lat: newLat, lng: newLng });
    setLocation({ lat: newLat, lng: newLng, address });

    mapRef.current?.panTo({ lat: newLat, lng: newLng });
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.display_name;

          setLocation({ lat: latitude, lng: longitude, address });

          mapRef.current?.panTo({ lat: latitude, lng: longitude });
          toast.success("Location fetched!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch address");
        }
      },
      () => toast.error("Failed to retrieve location")
    );
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <>
      <Autocomplete onLoad={(ac) => (autoCompleteRef.current = ac)} onPlaceChanged={handlePlaceSelect}>
        <input
          type="text"
          placeholder="Search or edit address"
          value={address}
          onChange={(e) => setLocation((prev) => ({ ...prev, address: e.target.value }))}
          className="w-full border px-4 py-2 rounded mt-2 mb-2"
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={14}
        onLoad={handleMapLoad}
      >
        <Marker position={markerPosition} draggable onDragEnd={handleMarkerDragEnd} />
      </GoogleMap>

      <button
        type="button"
        onClick={getCurrentLocation}
        className="text-blue-600 text-sm mt-1 hover:underline"
      >
        Use current location
      </button>
    </>
  );
};

export default LocationPicker;
