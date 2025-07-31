import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {login} from "../features/userSlice"
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact: "",
        password: "",
        confirmPassword: "",
        bio: "",
        location: { lat: "", lng: "" },
        address: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    const displayAddress = data.display_name || "Address not found";

                    setFormData((prev) => ({
                        ...prev,
                        location: { lat: latitude, lng: longitude },
                        address: displayAddress,
                    }));

                    toast.success("Location fetched successfully!");
                } catch (err) {
                    toast.error("Failed to fetch address");
                    console.error(err);
                }
            },
            (error) => {
                toast.error("Failed to fetch location");
                console.error(error);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { name, email, contact, password, confirmPassword, bio, location } = formData;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!location.lat || !location.lng) {
            toast.error("Please fetch your location before signing up.");
            return;
        }

        const geoLocation = {
            type: "Point",
            coordinates: [location.lng, location.lat]
        };

        try {
            const res = await axios.post(
                "/api/v1/users/register",
                { name, email, contact, password, bio, location: geoLocation },
                { withCredentials: true }
            );

            toast.success("Signup successful!");
            dispatch(login(res.data?.data));
            navigate("/dashboard")
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Signup failed. Try again."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-white via-[#f0f6ff] to-sky-200 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                <h2 className="text-2xl font-bold text-center mb-1">Join Your Community</h2>
                <p className="text-gray-600 text-center mb-6">Create your account to start helping</p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contact</label>
                        <input
                            name="contact"
                            type="tel"
                            placeholder="Enter your contact number"
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <textarea
                            readOnly
                            value={formData.address}
                            placeholder="Your address will appear here..."
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 h-16 resize-none"
                        ></textarea>
                        <button
                            type="button"
                            onClick={getLocation}
                            className="text-sm text-blue-600 mt-1 hover:underline"
                        >
                            Use current location
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 pr-10"
                            />
                            <div
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 pr-10"
                            />
                            <div
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Bio <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            name="bio"
                            rows="3"
                            placeholder="Tell your community a bit about yourself..."
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
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