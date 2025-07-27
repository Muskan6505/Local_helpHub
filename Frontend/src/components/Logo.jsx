import React from "react";
import logo from '../assets/Logo.png';
import { Link } from "react-router-dom";

const Logo = () => {
    return (
        <Link to='/' className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-10 w-10" />
            <h1 className="text-md md:text-xl font-bold">Local HelpHub</h1>
        </Link>
    );
};

export default Logo;
