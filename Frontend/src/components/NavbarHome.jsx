import { Home, Search, User, Plus, Menu } from "lucide-react";
import Logo from "./Logo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { logout } from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";

const NavbarHome = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.user);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const res = await axios.post("/api/v1/users/logout", {}, { withCredentials: true });
            if (res.data.success) toast.success(res.data.message);
            dispatch(logout());
            navigate("/", { replace: true });
        } catch {
            toast.error("Logging out failed");
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md shadow-[0_0_10px_rgba(0,0,0,0.6)] px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Logo />

                    {/* Desktop Links */}
                    <div className="hidden sm:flex gap-5 text-sm text-gray-700 font-medium items-center">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                                isActive("/dashboard") ? "text-blue-600 bg-blue-100" : "hover:text-black"
                            }`}
                        >
                            <Home size={16} />
                            Dashboard
                        </Link>
                        <Link
                            to="/requests"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                                isActive("/requests") ? "text-blue-600 bg-blue-100" : "hover:text-black"
                            }`}
                        >
                            <Search size={16} />
                            Browse Requests
                        </Link>
                        <Link
                            to="/myrequests"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                                isActive("/myrequests") ? "text-blue-600 bg-blue-100" : "hover:text-black"
                            }`}
                        >
                            <User size={16} />
                            My Requests
                        </Link>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                        <Link
                            to="/requests/create"
                            className="hidden sm:flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition"
                        >
                            <Plus size={16} />
                            Ask for Help
                        </Link>

                        {/* Profile Circle */}
                        <div
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-medium cursor-pointer overflow-hidden"
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="avatar"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span>{user?.name?.[0]?.toUpperCase() || "J"}</span>
                            )}
                        </div>

                        {/* Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white border shadow-lg rounded-md text-sm z-50">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800 w-full text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        )}

                        {/* Hamburger for mobile */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden mt-4 space-y-3 text-sm font-medium text-gray-700 px-1">
                        <Link
                            to="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md transition ${
                                isActive("/dashboard") ? "text-blue-600 bg-blue-100" : "hover:bg-gray-100"
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/requests"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md transition ${
                                isActive("/requests") ? "text-blue-600 bg-blue-100" : "hover:bg-gray-100"
                            }`}
                        >
                            Browse Requests
                        </Link>
                        <Link
                            to="/myrequests"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md transition ${
                                isActive("/myrequests") ? "text-blue-600 bg-blue-100" : "hover:bg-gray-100"
                            }`}
                        >
                            My Requests
                        </Link>
                        <Link
                            to="/requests/create"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Ask for Help
                        </Link>
                    </div>
                )}
            </nav>

            {/* Spacer to avoid content going under fixed navbar */}
            <div className="h-[72px] sm:h-[76px]" />
        </>
    );
};

export default NavbarHome;
