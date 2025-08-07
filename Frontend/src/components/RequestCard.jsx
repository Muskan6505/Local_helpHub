import React from "react";
import { MapPin, Clock, User } from "lucide-react";
import moment from "moment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const RequestCard = ({ request }) => {
    const {
        title,
        description,
        category,
        status,
        requester,
        createdAt,
        priority,
        tags = []
    } = request;

    const { user } = useSelector((state) => state.user);
    console.log("Current User:", user);
    const isOwnRequest = user?._id === requester?._id;

    const getStatusColor = () => {
        switch (status) {
            case "open":
                return "bg-green-100 text-green-800";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800";
            case "fulfilled":
                return "bg-gray-200 text-gray-600";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityColor = () => {
        switch (priority) {
            case "high":
                return "text-red-600 bg-red-100";
            case "medium":
                return "text-yellow-600 bg-yellow-100";
            case "low":
                return "text-blue-600 bg-blue-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between">
                {!isOwnRequest ? (
                    <div className="flex gap-3 items-start">
                    {/* Avatar */}
                    {requester?.avatar ? (
                        <img
                            src={requester.avatar}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-sm">
                            {requester?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <p className="font-medium text-gray-900">
                            {requester?.name || "Unknown"}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 gap-1">
                            <MapPin size={14} />
                            {requester?.location ? "Location shared" : "Location not available"}
                        </div>
                    </div>
                </div>

                ) : (
                    <div />
                )}

                {/* Status and Priority */}
                <div className="flex flex-col items-end gap-1">
                    <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${getStatusColor()}`}
                    >
                        {status}
                    </span>
                    <span
                        className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${getPriorityColor()}`}
                    >
                        {priority}
                    </span>
                </div>
            </div>

            {/* Title & Description */}
            <div>
                <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                    {description || "No description provided"}
                </p>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mt-1">
                {[category, ...tags].map((tag, idx) => (
                    <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            idx === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Time */}
            <div className="flex items-center text-sm text-gray-500 gap-1 mt-1">
                <Clock size={14} />
                {moment(createdAt).fromNow()}
            </div>

            {/* Action Button */}
            {!isOwnRequest && (
                <Link className="flex items-center justify-center gap-2 border mt-2 py-2 rounded-xl text-sm text-gray-800 hover:bg-gray-50 transition">
                    <User size={16} />
                    I Can Help
                </Link>
            )}
        </div>
    );
};

export default RequestCard;
