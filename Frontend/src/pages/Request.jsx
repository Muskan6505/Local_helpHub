import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { GoogleMap, Marker } from "@react-google-maps/api";
import haversine from "haversine-distance";
import { toast } from "react-toastify";
import { useGoogleMaps } from "../GoogleMapsProvider";

const mapContainerStyle = {
    width: "100%",
    height: "300px",
};

const Request = () => {
    const { isLoaded } = useGoogleMaps();
    const { id } = useParams();

    const [request, setRequest] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [message, setMessage] = useState("");

    // Get user's current location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            () => toast.error("Failed to get your location")
        );
    }, []);

    // Fetch the help request
    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axios.get(`/api/v1/help-requests/${id}`);
                const data = res.data.data;
                setRequest(data);

                // Convert GeoJSON [lng, lat] → { lat, lng }
                if (
                    userLocation &&
                    data.location?.coordinates &&
                    data.location.coordinates.length === 2
                ) {
                    const requestCoords = {
                        lat: data.location.coordinates[1],
                        lng: data.location.coordinates[0],
                    };
                    const dist = haversine(userLocation, requestCoords);
                    setDistance((dist / 1000).toFixed(2));
                }
            } catch (err) {
                toast.error("Failed to fetch request");
            }
        };

        if (userLocation) fetchRequest();
    }, [id, userLocation]);

    const handleHelp = async () => {
        if (!message.trim()) {
            toast.warn("Please enter a message before offering help.");
            return;
        }

        try {
            await axios.post(`/api/v1/responses/new`, {
                helpRequest: id,
                message,
            });
            toast.success("Response sent!");
            setMessage("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to send help");
        }
    };

    const handleMessage = () => {
        window.location.href = `/chat`;
    };

    if (!request || !isLoaded) return <div>Loading...</div>;

    // Convert GeoJSON coords for map
    const requestCoords = request.location?.coordinates
        ?   {
                lat: request.location.coordinates[1],
                lng: request.location.coordinates[0],
            }
        : null;

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-semibold">{request.title}</h1>
            <p className="text-gray-700">{request.description}</p>
            <p>
                <strong>Category:</strong> {request.category}
            </p>
            {distance && (
                <p>
                    <strong>Distance:</strong> {distance} km
                </p>
            )}

            {/* Tags */}
            {request.tags && request.tags.length > 0 && (
                <div>
                    <strong>Tags:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {request.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded overflow-hidden">
                {requestCoords && (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={requestCoords}
                        zoom={14}
                    >
                        <Marker position={requestCoords} />
                    </GoogleMap>
                )}
            </div>

            <div className="flex flex-col gap-3 mt-6">
                <textarea
                    className="border border-gray-300 p-2 rounded w-full"
                    placeholder="Enter your message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <div className="flex gap-4">
                    <button
                        onClick={handleHelp}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                    >
                        I Can Help
                    </button>
                    <button
                        onClick={handleMessage}
                        className="border border-gray-400 text-gray-800 hover:bg-gray-100 font-semibold py-2 px-4 rounded"
                    >
                        Message the User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Request;
