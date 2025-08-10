import React, { useEffect, useState } from "react";
import axios from "axios";
import RequestCard from "../components/RequestCard";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, X, CheckCircle, XCircle, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const MyRequest = () => {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);
    const [responses, setResponses] = useState([]);
    const [showResponses, setShowResponses] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [showContactId, setShowContactId] = useState(null);

    const handleViewResponses = async (requestId) => {
        try {
        const res = await axios.get(`/api/v1/responses/${requestId}`, {
            withCredentials: true,
        });

        setResponses(res.data.data);
        setSelectedRequest(requestId);
        setShowResponses(true);
        } catch (error) {
        console.error("Failed to fetch responses:", error);
        toast.error("Failed to fetch responses");
        }
    };

    const handleAction = async (responseId, action) => {
        try {
        setLoadingId(responseId);
        await axios.patch(
            `/api/v1/responses/${responseId}`,
            { status: action },
            { withCredentials: true }
        );

        toast.success(`Response ${action.toLowerCase()} successfully`);
        setResponses((prev) =>
            prev.map((r) =>
            r._id === responseId ? { ...r, status: action } : r
            )
        );
        } catch (error) {
            console.error(`Failed to ${action} response:`, error);
            toast.error(`Failed to ${action.toLowerCase()} response`);
        } finally {
            setLoadingId(null);
        }
    };

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
                    <button
                    onClick={() => handleViewResponses(request._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600"
                    >
                    Responses
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}

        {showResponses && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-xl font-semibold">Responses</h2>
                <button
                    onClick={() => setShowResponses(false)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <X size={20} />
                </button>
                </div>

                {/* List */}
                <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
                {responses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No responses yet.</p>
                ) : (
                    responses.map((resp) => (
                    <div
                        key={resp._id}
                        className="border rounded-lg p-4 flex gap-4 items-start"
                    >
                        {/* Avatar */}
                        <img
                        src={resp.helper?.avatar || "/default-avatar.png"}
                        alt={resp.helper?.name || "Helper"}
                        className="w-12 h-12 rounded-full object-cover"
                        />

                        {/* Info */}
                        <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                            <h3 className="font-semibold">{resp.helper?.name}</h3>
                            <p className="text-sm text-gray-500">
                                Trust Score: {resp.helper?.trustScore ?? "N/A"}
                            </p>
                            </div>
                            <span
                            className={`px-2 py-1 text-xs rounded-full ${
                                resp.status === "Accepted"
                                ? "bg-green-100 text-green-600"
                                : resp.status === "Rejected"
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                            >
                            {resp.status}
                            </span>
                        </div>

                        {/* Message */}
                        <p className="mt-2 text-gray-700">{resp.message}</p>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2">
                            {resp.status === "Pending" && (
                            <>
                                <button
                                onClick={() => handleAction(resp._id, "Accepted")}
                                disabled={loadingId === resp._id}
                                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                >
                                <CheckCircle size={16} /> Accept
                                </button>
                                <button
                                onClick={() => handleAction(resp._id, "Declined")}
                                disabled={loadingId === resp._id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                >
                                <XCircle size={16} /> Reject
                                </button>
                            </>
                            )}

                            <button
                            onClick={() =>
                                setShowContactId(
                                showContactId === resp._id ? null : resp._id
                                )
                            }
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                            <Eye size={16} /> View Contact
                            </button>
                        </div>

                        {/* Contact Info */}
                        {showContactId === resp._id && (
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <p>Email: {resp.helper?.email || "Not provided"}</p>
                            <p>Phone: {resp.helper?.contact || "Not provided"}</p>
                            </div>
                        )}
                        </div>
                    </div>
                    ))
                )}
                </div>
            </div>
            </div>
        )}
        </div>
    );
};

export default MyRequest;
