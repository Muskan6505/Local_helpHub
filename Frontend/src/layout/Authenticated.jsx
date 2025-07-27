import React from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from 'react-redux';
import { Navigate } from "react-router-dom";

const AuthenticatedLayout = () => {
    const user = useSelector((state) => state.user)
    const isAuthenticated = user.isLoggedIn;
    console.log("AuthenticatedLayout", isAuthenticated);
    return (
        isAuthenticated?
        <>
            <Outlet />
        </>
        :
        <Navigate to="/" />
    );
};

export default AuthenticatedLayout;