import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { logout, setUser } from "../features/userSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        bio: "",
        contact: "",
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                bio: user.bio || "",
                contact: user.contact || "",
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async () => {
        try {
            const { data } = await axios.patch("/api/v1/users/update", form, { withCredentials: true });
            toast.success("Profile updated!");
            dispatch(setUser(data.data));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Update failed");
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        try {
            const { data } = await axios.patch("/api/v1/users/avatar/update", formData, { withCredentials: true });
            toast.success("Avatar updated!");
            dispatch(setUser(data.data));
        } catch (err) {
            toast.error("Avatar upload failed");
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            const { data } = await axios.delete("/api/v1/users/avatar", { withCredentials: true });
            toast.success("Avatar removed!");
            dispatch(setUser(data.data));
        } catch (err) {
            toast.error("Failed to remove avatar");
        }
    };

    const handleChangePassword = async () => {
        try {
            await axios.patch("/api/v1/users/password/change", passwordData, { withCredentials: true });
            toast.success("Password changed!");
            setPasswordData({ currentPassword: "", newPassword: "" });
        } catch (err) {
            toast.error("Password change failed");
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account?")) return;
        try {
            await axios.delete("/api/v1/users", { withCredentials: true });
            toast.success("Account deleted");
            dispatch(logout());
            navigate("/");
        } catch (err) {
            toast.error("Failed to delete account");
        }
    };

    const handleLogout = async () => {
        try {
            const res = await axios.post("api/v1/users/logout", {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
            }
            dispatch(logout());
            setDropdownOpen(false);
            setMobileMenuOpen(false);
            navigate("/", { replace: true });
        } catch (err) {
            toast.error("Logging out failed" || err?.response?.data?.message);
        }
    };

    return (
        <div className="bg-gradient-to-r from-white via-sky-50 to-sky-100 pt-15">
            <div className="max-w-3xl mx-auto p-6 space-y-8 bg-white shadow-xl rounded-2xl">
                <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>

                <div className="flex items-center gap-6">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="avatar"
                            className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-blue-700 border-2 border-blue-500">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                    <div className="space-y-2">
                        <input
                            type="file"
                            onChange={(e) => setAvatarFile(e.target.files[0])}
                            className="block"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAvatarUpload}
                                className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700"
                            >
                                Upload
                            </button>
                            {user?.avatar && (
                                <button
                                    onClick={handleDeleteAvatar}
                                    className="text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Name"
                    />
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border p-3 rounded-md bg-gray-100 cursor-not-allowed"
                        placeholder="Email"
                        disabled
                    />
                    <input
                        type="text"
                        name="contact"
                        value={form.contact}
                        onChange={handleChange}
                        className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Contact"
                    />
                    <textarea
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Bio"
                        rows={3}
                    />
                    <button
                        onClick={handleUpdateProfile}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                    >
                        Save Changes
                    </button>
                </div>

                <hr className="my-6" />

                <div className="space-y-4">
                    <h2 className="font-semibold text-xl">Change Password</h2>
                    <input
                        type="password"
                        name="oldPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Old Password"
                    />
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="New Password"
                    />
                    <button
                        onClick={handleChangePassword}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                        Change Password
                    </button>
                </div>

                <hr className="my-6" />
                <button
                    onClick={handleLogout}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 w-full"
                >
                    Logout
                </button>

                <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 w-full"
                >
                    Delete My Account
                </button>
            </div>
        </div>
    );
};

export default Profile;
