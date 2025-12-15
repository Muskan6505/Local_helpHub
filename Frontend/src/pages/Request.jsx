import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import haversine from "haversine-distance";
import { toast } from "react-toastify";
import { useGoogleMaps } from "../GoogleMapsProvider";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const mapContainerStyle = {
    width: "100%",
    height: "300px",
};

const Request = () => {
    const { isLoaded } = useGoogleMaps();
    const { id } = useParams();
    const { user } = useSelector((state) => state.user);

    const [request, setRequest] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [message, setMessage] = useState("");
    const [alreadyResponded, setAlreadyResponded] = useState(false);
    const [directions, setDirections] = useState(null);
    const navigate = useNavigate();

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

                if (userLocation && data.location?.coordinates?.length === 2) {
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

    // Check if user has already responded
    useEffect(() => {
        const checkResponse = async () => {
            if (!user?._id) return;
            try {
                const res = await axios.get(`/api/v1/responses/check/${id}`, {
                    withCredentials: true
                });
                setAlreadyResponded(res.data?.data?.exists || false);
            } catch (err) {
                console.error("Failed to check responses", err);
            }
        };

        checkResponse();
    }, [id, user?._id]);

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
            setAlreadyResponded(true);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to send help");
        }
    };

    const handleMessage = () => {
        window.location.href = `/chat/${request.requester._id}/${request._id}`;
    };

    const handleGetDirections = () => {
        if (!userLocation || !request?.location?.coordinates) {
            toast.error("Missing location data");
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: userLocation,
                destination: {
                    lat: request.location.coordinates[1],
                    lng: request.location.coordinates[0],
                },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK" && result) {
                    setDirections(result);
                } else {
                    toast.error("Failed to get directions");
                }
            }
        );
    };

    if (!request || !isLoaded) return <div>Loading...</div>;

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

            {request.tags?.length > 0 && (
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

            {alreadyResponded && (
            <div className="rounded overflow-hidden">
                {requestCoords && (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={requestCoords}
                    zoom={14}
                >
                    <Marker position={requestCoords} />
                    {directions && (
                    <DirectionsRenderer directions={directions} />
                    )}
                </GoogleMap>
                )}
            </div>
            )}


            <button
                onClick={handleGetDirections}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
                Get Directions
            </button>

            <div className="flex flex-col gap-3 mt-6">
                {!alreadyResponded && (
                    <textarea
                        className="border border-gray-300 p-2 rounded w-full"
                        placeholder="Enter your message"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                )}

                <div className="flex gap-4">
                    {!alreadyResponded && (
                        <button
                            onClick={handleHelp}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            I Can Help
                        </button>
                    )}

                    {alreadyResponded && (
                        <button
                        onClick={handleMessage}
                        className="border border-gray-500 text-gray-800 hover:bg-gray-200 font-semibold py-2 px-4 rounded bg-sky-100"
                    >
                        Message the User
                    </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Request;
