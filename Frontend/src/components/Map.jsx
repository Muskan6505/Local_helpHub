import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const center = { lat: 28.6139, lng: 77.2090 }; 

export const MapComponent = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'], 
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "400px" }}
      center={center}
      zoom={12}
    >
      <Marker position={center} />
    </GoogleMap>
  );
};
