import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-white via-sky-50 to-sky-100 px-4">
            <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6 text-center">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition"
            >
                Go to Homepage
            </Link>
        </div>
    );
};

export default NotFound;
