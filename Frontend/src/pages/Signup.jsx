import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { login } from "../features/userSlice";
import Logo from "../components/Logo";

const containerStyle = {
    width: "100%",
    height: "300px",
};

const center = {
    lat: 20.5937,
    lng: 78.9629,
};

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact: "",
        password: "",
        confirmPassword: "",
        bio: "",
        lat: "",
        lng: "",
        address: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [markerPosition, setMarkerPosition] = useState(center);
    const mapRef = useRef(null);
    const autoCompleteRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ["places"],
    });

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

        setFormData((prev) => ({
            ...prev,
            lat: newLat,
            lng: newLng,
            address: address,
        }));
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
        setFormData((prev) => ({
        ...prev,
        lat: newLat,
        lng: newLng,
        address: address,
        }));

        mapRef.current.panTo({ lat: newLat, lng: newLng });
    };

    const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });

        try {
            const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const address = data.display_name;

            setFormData((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: address,
            }));

            mapRef.current?.panTo({ lat: latitude, lng: longitude });
            toast.success("Location fetched!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch address");
        }
        },
        (error) => {
        console.error(error);
        toast.error("Failed to retrieve location");
        },
        {
        enableHighAccuracy: true, // Try GPS over Wi-Fi
        timeout: 10000,           // Wait up to 10 seconds
        maximumAge: 0             // No cached positions
        }
    );
    };


    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const {
        name,
        email,
        contact,
        password,
        confirmPassword,
        bio,
        lat,
        lng,
        } = formData;

        if (password !== confirmPassword) return toast.error("Passwords do not match");
        if (!lat || !lng) return toast.error("Please provide your location");

        const location = {
        type: "Point",
        coordinates: [lng, lat],
        };

        try {
        const res = await axios.post(
            "/api/v1/users/register",
            { name, email, contact, password, bio, location },
            { withCredentials: true }
        );

        toast.success("Signup successful!");
        dispatch(login(res.data?.data));
        navigate("/dashboard");
        } catch (err) {
        toast.error(err.response?.data?.message || "Signup failed");
        }
    };

    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-r from-white via-[#f0f6ff] to-sky-200 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <div className="flex justify-center mb-6">
            <Logo />
            </div>

            <h2 className="text-2xl font-bold text-center mb-1">Join Your Community</h2>
            <p className="text-gray-600 text-center mb-6">Create your account to start helping</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Inputs */}
            <input
                name="name"
                type="text"
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="w-full border px-4 py-2 rounded"
            />
            <input
                name="email"
                type="email"
                onChange={handleChange}
                required
                placeholder="Email"
                className="w-full border px-4 py-2 rounded"
            />
            <input
                name="contact"
                type="tel"
                onChange={handleChange}
                required
                placeholder="Contact Number"
                className="w-full border px-4 py-2 rounded"
            />

            {/* Autocomplete Search */}
            <Autocomplete onLoad={(ac) => (autoCompleteRef.current = ac)} onPlaceChanged={handlePlaceSelect}>
                <input
                type="text"
                placeholder="Search or edit address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border px-4 py-2 rounded"
                />
            </Autocomplete>

            {/* Map + Marker */}
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={markerPosition}
                zoom={14}
                onLoad={handleMapLoad}
            >
                <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>

            <button
                type="button"
                onClick={getCurrentLocation}
                className="text-blue-600 text-sm mt-1 hover:underline"
            >
                Use current location
            </button>

            {/* Passwords */}
            <div className="relative">
                <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 pr-10 rounded"
                />
                <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
            </div>

            <div className="relative">
                <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 pr-10 rounded"
                />
                <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
            </div>

            <textarea
                name="bio"
                placeholder="Tell us about yourself (optional)"
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded resize-none"
                rows={3}
            />

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
                Create Account
            </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
            </Link>
            </p>
        </div>
        </div>
    );
};

export default Signup;
