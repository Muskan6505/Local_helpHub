import React, { useEffect, useState } from "react";
import axios from "axios";
import RequestCard from "../components/RequestCard";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const MyRequest = () => {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);

    useEffect(() => {
        if (!user?._id) return;

        const fetchMyRequests = async () => {
            try {
                const response = await axios.get(`/api/v1/help-requests`, {
                    withCredentials: true,
                });

                const filtered = response.data.data.filter(
                    (request) => request.requester._id === user._id
                );
                setMyRequests(filtered);
            } catch (error) {
                console.error("Failed to fetch requests:", error);
                toast.error("Failed to fetch your requests");
            } finally {
                setLoading(false);
            }
        };

        fetchMyRequests();
    }, [user?._id]);

    const handleEdit = (id) => {
        navigate(`/edit-request/${id}`);
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this request?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`/api/v1/help-requests/${id}`, {
                withCredentials: true,
            });

            setMyRequests((prev) => prev.filter((req) => req._id !== id));
            toast.success("Request deleted successfully");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete the request");
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">My Help Requests</h2>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
                    <span className="ml-2 text-gray-600">Loading...</span>
                </div>
            ) : myRequests.length === 0 ? (
                <p className="text-gray-500 text-lg">You haven't posted any requests yet.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRequests.map((request) => (
                        <div key={request._id} className="relative group">
                            <RequestCard request={request} />
                            <div className="absolute top-4 left-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(request._id)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(request._id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600"
                                >
                                    <Trash2 className="w-4 h-4 inline-block mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyRequest;
