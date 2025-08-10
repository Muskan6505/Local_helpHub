import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { useGoogleMaps } from "../GoogleMapsProvider";

const containerStyle = { width: "100%", height: "250px" };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const LocationPicker = ({ lat, lng, address, setLocation }) => {
  const { isLoaded } = useGoogleMaps();
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);

  const mapRef = useRef(null);
  const autoCompleteRef = useRef(null);

  useEffect(() => {
    if (lat && lng) {
      setMarkerPosition({ lat, lng });
    }
  }, [lat, lng]);

  const handleMarkerDragEnd = async (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPosition({ lat: newLat, lng: newLng });
    fetchAddress(newLat, newLng);
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

  const fetchAddress = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await res.json();
      setLocation({ lat: latitude, lng: longitude, address: data.display_name });
    } catch {
      toast.error("Failed to fetch address");
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMarkerPosition({ lat: coords.latitude, lng: coords.longitude });
        fetchAddress(coords.latitude, coords.longitude);
        mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
        toast.success("Location fetched!");
      },
      () => toast.error("Failed to retrieve location")
    );
  };

  if (!isLoaded) return null;

  return (
    <div>
      <Autocomplete onLoad={(ac) => (autoCompleteRef.current = ac)} onPlaceChanged={handlePlaceSelect}>
        <input
          type="text"
          placeholder="Search or edit address"
          value={address}
          onChange={(e) => setLocation((prev) => ({ ...prev, address: e.target.value }))}
          className="w-full border px-4 py-2 rounded mb-2"
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={14}
        onLoad={(map) => (mapRef.current = map)}
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
    </div>
  );
};

export default LocationPicker;
