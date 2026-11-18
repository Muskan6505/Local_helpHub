import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, Users, MessageSquare, MapPin, Clock, CheckCircle2 } from "lucide-react";
import moment from "moment";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const categoryColors = {
  "Garbage & Waste": "bg-amber-100 text-amber-800 border-amber-200",
  "Roads & Potholes": "bg-red-100 text-red-800 border-red-200",
  "Drainage & Water": "bg-blue-100 text-blue-800 border-blue-200",
  "Streetlights & Electricity": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Animal Welfare": "bg-orange-100 text-orange-800 border-orange-200",
  "Sanitation": "bg-teal-100 text-teal-800 border-teal-200",
  "Other": "bg-gray-100 text-gray-800 border-gray-200",
};

const statusStyles = {
  Reported: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const CommunityPostCard = ({ post, onPostUpdated }) => {
  const { user } = useSelector((state) => state.user);
  const [upvotesCount, setUpvotesCount] = useState(post.upvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(
    post.upvotes?.some((id) => (typeof id === "object" ? id._id === user?._id : id === user?._id)) || false
  );
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (upvoting) return;

    try {
      setUpvoting(true);
      const res = await axios.patch(
        `/api/v1/community-posts/${post._id}/upvote`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setUpvotesCount(res.data.data.upvotesCount);
        setHasUpvoted(res.data.data.hasUpvoted);
        if (onPostUpdated) onPostUpdated();
      }
    } catch {
      toast.error("Failed to update upvote");
    } finally {
      setUpvoting(false);
    }
  };

  const coverImage = post.images?.[0] || post.resolutionProof?.image;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Image Preview */}
      <Link to={`/community/${post._id}`} className="relative h-48 w-full bg-gray-100 overflow-hidden block">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-200">
            <MapPin size={36} className="text-gray-300 mb-1" />
            <span className="text-xs font-medium text-gray-500">No photo provided</span>
          </div>
        )}

        {/* Status Badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${
            statusStyles[post.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {post.status === "Resolved" && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
          {post.status}
        </span>

        {/* Resolution Badge if Proof exists */}
        {post.status === "Resolved" && post.resolutionProof?.image && (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-600 text-white shadow">
            Proof Available ✓
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Date */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                categoryColors[post.category] || categoryColors.Other
              }`}
            >
              {post.category}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              {moment(post.createdAt).fromNow()}
            </span>
          </div>

          {/* Title */}
          <Link to={`/community/${post._id}`} className="block">
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-base group-hover:text-blue-600 transition">
              {post.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
            {post.description}
          </p>

          {/* Address */}
          {post.address && (
            <div className="flex items-center text-xs text-gray-500 gap-1 mt-2.5 line-clamp-1">
              <MapPin size={13} className="text-gray-400 shrink-0" />
              <span className="truncate">{post.address}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                {post.author?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
              {post.author?.name || "Neighbor"}
            </span>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-3">
            {/* Volunteers */}
            <span
              className="flex items-center gap-1 text-xs text-gray-500"
              title={`${post.volunteers?.length || 0} volunteers joining`}
            >
              <Users size={14} className="text-indigo-600" />
              <span>{post.volunteers?.length || 0}</span>
            </span>

            {/* Comments */}
            <Link
              to={`/community/${post._id}#comments`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
              title={`${post.comments?.length || 0} comments`}
            >
              <MessageSquare size={14} />
              <span>{post.comments?.length || 0}</span>
            </Link>

            {/* Upvote Button */}
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                hasUpvoted
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ThumbsUp size={13} className={hasUpvoted ? "fill-white" : ""} />
              <span>{upvotesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPostCard;
