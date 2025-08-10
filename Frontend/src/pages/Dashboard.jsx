import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Users, Loader2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import RequestCard from "../components/RequestCard"; 

const Dashboard = () => {
    const { user } = useSelector((state) => state.user);

    const [recentRequests, setRecentRequests] = useState([]);
    const [myResponses, setMyResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?._id) return;

        const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const requestsRes = await axios.get("/api/v1/help-requests");
            const responsesRes = await axios.get(`/api/v1/responses`);

            const now = new Date();
            const filtered = requestsRes.data.data.filter((req) => {
            if (req.requester?._id === user._id) return false;

            const requestDate = new Date(req.createdAt);
            const diffHours = (now - requestDate) / (1000 * 60 * 60);
            return diffHours <= 24;
            });

            console.log("Response data:", responsesRes.data.data);

            setRecentRequests(filtered);
            setMyResponses(responsesRes.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
        } finally {
            setLoading(false);
        }
        };

        fetchDashboardData();
    }, [user?._id]);

    return (
        <div className="px-8 py-10 bg-gray-50 min-h-screen">
        <div className="min-h-[50vh]">
            <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user.name}! <span className="inline-block">👋</span>
            </h1>
            <p className="text-gray-600 mt-2">
            Here's what's happening in your community today.
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Ask for Help Card */}
            <div className="flex justify-between items-center p-6 rounded-xl border border-blue-200 bg-blue-50 shadow-sm hover:shadow-md transition-shadow">
                <div>
                <h2 className="text-lg font-semibold text-blue-900">Need Help?</h2>
                <p className="text-sm text-blue-700 mt-1">
                    Post a request and connect with helpers in your area.
                </p>
                <Link
                    to="/requests/create"
                    className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
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
                <Link
                    to="/requests"
                    className="mt-4 flex items-center gap-2 border border-green-500 text-green-800 px-4 py-2 rounded-md hover:bg-green-100"
                >
                    <Users size={18} />
                    Browse Requests
                </Link>
                </div>
                <div>
                <span className="text-green-200 text-6xl">👥</span>
                </div>
            </div>
            </div>

            {/* Dashboard Data */}
            <div className="mt-10">
            {loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="animate-spin" size={20} />
                Loading your dashboard...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Recent Requests */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">Recent Requests</h2>
                    {recentRequests.length > 0 ? (
                    <div className="space-y-4">
                        {recentRequests.map((req) => (
                        <RequestCard key={req._id} request={req} />
                        ))}
                    </div>
                    ) : (
                    <p className="text-gray-500">No recent requests found.</p>
                    )}
                </div>

                {/* Right: My Responses */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">My Responses</h2>
                    {myResponses.length > 0 ? (
                    <ul className="space-y-3">
                        {myResponses.map((res) => {
                        const isAccepted = res.status === "Accepted";
                        return (
                            <li
                            key={res._id}
                            className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md"
                            >
                            <p className="font-medium">
                                Response to:{" "}
                                <span className="text-blue-600 font-semibold">
                                {res.helpRequest?.title || "Untitled Request"}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{res.message}</p>
                            <span
                                className={`mt-2 inline-block px-3 py-1 text-xs rounded-full ${
                                isAccepted
                                    ? "bg-green-100 text-green-800"
                                    : res.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                                {res.status}
                            </span>

                            {isAccepted && res.helpRequest?.requester && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-900 font-medium">
                                    Contact Details:
                                </p>
                                {res.helpRequest.requester.contact && (
                                    <p className="text-sm text-gray-700">
                                    📞 {res.helpRequest.requester.contact}
                                    </p>
                                )}
                                {res.helpRequest.requester.email && (
                                    <p className="text-sm text-gray-700">
                                    📧 {res.helpRequest.requester.email}
                                    </p>
                                )}

                                <Link
                                to={`/chat`}
                                    className="mt-2 flex items-center gap-1 text-blue-600 hover:underline"
                                    onClick={() =>
                                    console.log("Open message UI for", res.helpRequest.requester._id)
                                    }
                                >
                                    <MessageCircle size={16} />
                                    Message
                                </Link>
                                </div>
                            )}
                            </li>
                        );
                        })}
                    </ul>
                    ) : (
                    <p className="text-gray-500">
                        You haven’t responded to any requests yet.
                    </p>
                    )}
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
};

export default Dashboard;