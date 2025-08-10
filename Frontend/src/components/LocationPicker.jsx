import React, { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { useGoogleMaps } from "../GoogleMapsProvider";

const containerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const LocationPicker = ({ lat, lng, address, setLocation }) => {
  const { isLoaded } = useGoogleMaps(); // ✅ now from provider
  const [markerPosition, setMarkerPosition] = useState({
    lat: lat || defaultCenter.lat,
    lng: lng || defaultCenter.lng,
  });

  const mapRef = useRef(null);
  const autoCompleteRef = useRef(null);

  useEffect(() => {
    if (lat && lng) setMarkerPosition({ lat, lng });
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
      setLocation({ lat: newLat, lng: newLng, address: data.display_name });
    } catch {
      toast.error("Failed to fetch address");
    }
  };

  const handlePlaceSelect = () => {
    const place = autoCompleteRef.current.getPlace();
    if (!place.geometry) return;

    const newLat = place.geometry.location.lat();
    const newLng = place.geometry.location.lng();
    setMarkerPosition({ lat: newLat, lng: newLng });
    setLocation({ lat: newLat, lng: newLng, address: place.formatted_address });
    mapRef.current?.panTo({ lat: newLat, lng: newLng });
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setMarkerPosition({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocation({ lat: latitude, lng: longitude, address: data.display_name });
          mapRef.current?.panTo({ lat: latitude, lng: longitude });
          toast.success("Location fetched!");
        } catch {
          toast.error("Failed to fetch address");
        }
      },
      () => toast.error("Failed to retrieve location")
    );
  };

  if (!isLoaded) return null; // ✅ provider already shows loader

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