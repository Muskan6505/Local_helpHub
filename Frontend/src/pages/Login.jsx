import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { login } from "../features/userSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";



const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(
                "/api/v1/users/login",
                formData,
                { withCredentials: true }
            );
            const user = res.data.data;
            toast.success("Login successful!");
            dispatch(login(user));
            navigate("/dashboard");
        } catch (error) {
            const msg = error.response?.data?.message || "Login failed!";
            toast.error(msg);
        }
    };

    const { isLoggedIn } = useSelector((state) => state.user);

    if (isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-l via-[#f0f6ff] from-sky-200 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-6">
                    <Logo />
                    <h2 className="text-2xl font-bold text-gray-800 mt-4">Welcome Back</h2>
                    <p className="text-gray-600 text-sm text-center mt-1">
                        Sign in to continue helping your community
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePassword}
                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Sign In
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-4">
                        Don’t have an account?{" "}
                        <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
