import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Eye, EyeOff } from "lucide-react"; 

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        location: "",
        password: "",
        confirmPassword: "",
        bio: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-white via-[#f0f6ff] to-sky-200 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                <h2 className="text-2xl font-bold text-center mb-1">Join Your Community</h2>
                <p className="text-gray-600 text-center mb-6">Create your account to start helping</p>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            name="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            name="location"
                            type="text"
                            placeholder="e.g., Mission District, San Francisco"
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Bio <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            name="bio"
                            rows="3"
                            placeholder="Tell your community a bit about yourself..."
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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