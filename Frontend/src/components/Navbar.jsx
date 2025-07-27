import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="w-full px-6 py-4 shadow-md fixed top-0 left-0 bg-gradient-to-r from-white via-sky-100 to-sky-200 z-50">
            <div className="flex items-center justify-between">
                <Logo />

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-gray-700 hover:text-black font-medium">
                        Sign In
                    </Link>
                    <Link
                        to="/signup"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="flex flex-col mt-4 md:hidden gap-2 bg-white rounded-lg p-4 shadow">
                    <Link
                        to="/login"
                        className="text-gray-700 hover:text-black font-medium w-full text-left"
                        onClick={closeMenu}
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/signup"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full text-left"
                        onClick={closeMenu}
                    >
                        Get Started
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
