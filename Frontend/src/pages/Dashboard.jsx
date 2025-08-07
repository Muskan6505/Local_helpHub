import React from "react";
import {useSelector} from "react-redux"
import {Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
    const {user} = useSelector((state) => state.user)
    
    return (
        <div className="px-8 py-10 bg-gray-50 min-h-screen">
            <div className=" min-h-[50vh]">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {user.name}! <span className="inline-block">👋</span>
                </h1>
                <p className="text-gray-600 mt-2">
                    Here's what's happening in your community today.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Ask for Help Card */}
                    <div className="flex justify-between items-center p-6 rounded-xl border border-blue-200 bg-blue-50 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <div>
                        <h2 className="text-lg font-semibold text-blue-900">Need Help?</h2>
                        <p className="text-sm text-blue-700 mt-1">
                        Post a request and connect with helpers in your area.
                        </p>
                        
                    </div>
                    <Link to='/requests/create' className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <Plus size={18} />
                        Ask for Help
                    </Link>
                    </div>
                    <div>
                        <span className="text-blue-200 text-6xl">🤍</span>
                    </div>
                    </div>

                    {/* Browse Requests Card */}
                    <div className="flex justify-between items-center p-6 rounded-xl border border-green-200 bg-green-50 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <h2 className="text-lg font-semibold text-green-900">Want to Help?</h2>
                        <p className="text-sm text-green-700 mt-1">
                        Browse requests from neighbors who need assistance.
                        </p>
                        <Link to='/requests' className="mt-4 flex items-center gap-2 border border-green-500 text-green-800 px-4 py-2 rounded-md hover:bg-green-100">
                        <Users size={18} />
                        Browse Requests
                        </Link>
                    </div>
                    <div>
                        <span className="text-green-200 text-6xl">👥</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>

        
    )
}

export default Dashboard