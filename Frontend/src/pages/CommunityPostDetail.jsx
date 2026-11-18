import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import moment from "moment";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ThumbsUp,
  Users,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  Upload,
  X,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "../GoogleMapsProvider";

const mapContainerStyle = {
  width: "100%",
  height: "260px",
  borderRadius: "1rem"
};

const CommunityPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded: isMapLoaded } = useGoogleMaps();
  const { user } = useSelector((state) => state.user);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Actions
  const [upvoting, setUpvoting] = useState(false);
  const [volunteering, setVolunteering] = useState(false);

  // Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/community-posts/${id}`, {
        withCredentials: true
      });
      if (res.data?.success) {
        setPost(res.data.data);
        if (res.data.data.images?.length > 0) {
          setActiveImage(res.data.data.images[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load community post");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const isAuthor = post?.author?._id === user?._id;
  const isVolunteer = post?.volunteers?.some((v) => v._id === user?._id);
  const hasUpvoted = post?.upvotes?.some((v) => (typeof v === "object" ? v._id === user?._id : v === user?._id));

  // Handle Upvote
  const handleUpvote = async () => {
    if (upvoting) return;
    try {
      setUpvoting(true);
      const res = await axios.patch(
        `/api/v1/community-posts/${id}/upvote`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setPost((prev) => {
          const updatedUpvotes = res.data.data.hasUpvoted
            ? [...(prev.upvotes || []), user._id]
            : (prev.upvotes || []).filter((uid) => (typeof uid === "object" ? uid._id !== user._id : uid !== user._id));
          return { ...prev, upvotes: updatedUpvotes };
        });
      }
    } catch {
      toast.error("Failed to update upvote");
    } finally {
      setUpvoting(false);
    }
  };

  // Handle Volunteer Join
  const handleVolunteer = async () => {
    if (volunteering) return;
    try {
      setVolunteering(true);
      const res = await axios.patch(
        `/api/v1/community-posts/${id}/volunteer`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setPost((prev) => ({
          ...prev,
          volunteers: res.data.data.volunteers,
          status: res.data.data.status
        }));
      }
    } catch {
      toast.error("Failed to update volunteer participation");
    } finally {
      setVolunteering(false);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await axios.post(
        `/api/v1/community-posts/${id}/comments`,
        { text: commentText.trim() },
        { withCredentials: true }
      );
      if (res.data?.success) {
        setPost((prev) => ({ ...prev, comments: res.data.data }));
        setCommentText("");
        toast.success("Comment added");
      }
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await axios.delete(`/api/v1/community-posts/${id}`, {
        withCredentials: true
      });
      if (res.data?.success) {
        toast.success("Report deleted");
        navigate("/community");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // Handle Proof Image Select
  const handleProofImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // Handle Resolve Submission
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      setResolving(true);
      const formData = new FormData();
      formData.append("status", "Resolved");
      formData.append("note", resolutionNote);
      if (proofImage) {
        formData.append("proofImage", proofImage);
      }

      const res = await axios.patch(
        `/api/v1/community-posts/${id}/status`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      if (res.data?.success) {
        toast.success("Issue marked as resolved!");
        setPost(res.data.data);
        setShowResolveModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin text-blue-600 mr-2" />
        <span>Loading report details...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="text-lg font-semibold">Post not found</p>
        <Link to="/community" className="text-blue-600 hover:underline mt-2">
          Back to Community Feed
        </Link>
      </div>
    );
  }

  const [lng, lat] = post.location?.coordinates || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft size={16} /> Back to Community Feed
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
        {/* Status Tracker */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 sm:px-8">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow">
                1
              </div>
              <span className="text-xs font-semibold text-gray-800 mt-1">Reported</span>
            </div>

            <div className={`flex-1 h-1 mx-2 rounded ${post.status !== "Reported" ? "bg-indigo-600" : "bg-gray-200"}`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                  post.status === "In Progress" || post.status === "Resolved"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span className="text-xs font-semibold text-gray-800 mt-1">In Progress</span>
            </div>

            <div className={`flex-1 h-1 mx-2 rounded ${post.status === "Resolved" ? "bg-emerald-600" : "bg-gray-200"}`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                  post.status === "Resolved"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <span className="text-xs font-semibold text-gray-800 mt-1">Resolved</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {post.category}
                </span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    post.status === "Resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : post.status === "In Progress"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {post.title}
              </h1>

              {/* Author & Time */}
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {post.author?.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {post.author?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">{post.author?.name}</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  {moment(post.createdAt).format("MMM D, YYYY · h:mm A")}
                </span>
              </div>
            </div>

            {/* Author Delete Action */}
            {isAuthor && (
              <button
                onClick={handleDeletePost}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition text-sm flex items-center gap-1"
              >
                <Trash2 size={16} /> Delete Report
              </button>
            )}
          </div>

          {/* Image Showcase */}
          {post.images && post.images.length > 0 && (
            <div className="space-y-3">
              <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={activeImage || post.images[0]}
                  alt="Issue preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {post.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {post.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                        activeImage === img ? "border-blue-600 ring-2 ring-blue-500/20" : "border-gray-200 opacity-70"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
              {post.description}
            </p>
          </div>

          {/* Before & After Proof Showcase if Resolved */}
          {post.status === "Resolved" && (
            <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
                <CheckCircle2 size={22} className="text-emerald-600" />
                Issue Resolved & Verified
              </div>

              {post.resolutionProof?.note && (
                <p className="text-sm text-emerald-900 bg-white/70 p-3.5 rounded-xl border border-emerald-100">
                  <span className="font-semibold">Resolution Note:</span> {post.resolutionProof.note}
                </p>
              )}

              {/* Before and After Image Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {post.images?.[0] && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Before (Reported Problem)
                    </span>
                    <div className="h-56 rounded-2xl overflow-hidden border border-gray-200">
                      <img src={post.images[0]} alt="Before resolution" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {post.resolutionProof?.image && (
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      After (Resolved State Proof)
                    </span>
                    <div className="h-56 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                      <img
                        src={post.resolutionProof.image}
                        alt="After resolution"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {post.resolutionProof?.resolvedBy && (
                <div className="text-xs text-emerald-700 font-medium pt-1">
                  Resolved by {post.resolutionProof.resolvedBy.name} on{" "}
                  {moment(post.resolutionProof.resolvedAt).format("MMM D, YYYY")}
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
            {/* Upvote Button */}
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm ${
                hasUpvoted
                  ? "bg-blue-600 text-white shadow-blue-500/20"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              <ThumbsUp size={16} className={hasUpvoted ? "fill-white" : ""} />
              <span>{hasUpvoted ? "Supported" : "Support Report"}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-black/10">
                {post.upvotes?.length || 0}
              </span>
            </button>

            {/* Volunteer Join Button */}
            <button
              onClick={handleVolunteer}
              disabled={volunteering}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm ${
                isVolunteer
                  ? "bg-indigo-600 text-white shadow-indigo-500/20"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Users size={16} />
              <span>{isVolunteer ? "You are Volunteering ✓" : "Volunteer to Resolve"}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-black/10">
                {post.volunteers?.length || 0}
              </span>
            </button>

            {/* Mark as Resolved Modal Trigger */}
            {(isAuthor || isVolunteer) && post.status !== "Resolved" && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 ml-auto"
              >
                <CheckCircle2 size={16} />
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Map & Location + Volunteers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Location & Map (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              Exact Issue Location
            </h3>
            {post.address && <span className="text-xs text-gray-500 truncate max-w-xs">{post.address}</span>}
          </div>

          {isMapLoaded && lat && lng ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat, lng }}
              zoom={15}
            >
              <Marker position={{ lat, lng }} />
            </GoogleMap>
          ) : (
            <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xs">
              Map loading...
            </div>
          )}
        </div>

        {/* Volunteers Box (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-indigo-600" />
              Volunteers ({post.volunteers?.length || 0})
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Neighbors who pledged to collaborate on resolving this issue.
            </p>

            <div className="space-y-3 max-h-56 overflow-y-auto">
              {post.volunteers?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No volunteers yet. Be the first!</p>
              ) : (
                post.volunteers.map((vol) => (
                  <div key={vol._id} className="flex items-center gap-2.5">
                    {vol.avatar ? (
                      <img src={vol.avatar} alt={vol.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {vol.name?.[0]?.toUpperCase() || "V"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-800">{vol.name}</p>
                      <p className="text-[10px] text-gray-400">Score: {vol.trustScore || 0}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {!isVolunteer && post.status !== "Resolved" && (
            <button
              onClick={handleVolunteer}
              disabled={volunteering}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow"
            >
              Join this Resolution Effort
            </button>
          )}
        </div>
      </div>

      {/* Discussion / Comments Section */}
      <div id="comments" className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          Community Discussion ({post.comments?.length || 0})
        </h3>

        {/* Comment input */}
        <form onSubmit={handleCommentSubmit} className="flex gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share an update, suggest a solution, or coordinate resources..."
            className="flex-1 border border-gray-300 px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Post
          </button>
        </form>

        {/* Comment list */}
        <div className="space-y-4 pt-2">
          {post.comments?.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">
              No comments yet. Start the conversation!
            </p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment._id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
                {comment.user?.avatar ? (
                  <img src={comment.user.avatar} alt={comment.user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {comment.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{comment.user?.name || "Neighbor"}</span>
                    <span className="text-[11px] text-gray-400">{moment(comment.createdAt).fromNow()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mark Resolved Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
            <button
              onClick={() => setShowResolveModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Issue as Resolved</h3>
                <p className="text-xs text-gray-500">Provide resolution proof for the community.</p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {/* After image upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Upload "After" Resolution Proof Photo
                </label>
                <div className="mt-1">
                  {proofPreview ? (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-200">
                      <img src={proofPreview} alt="Proof preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage(null);
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs font-semibold text-gray-700">Click to upload resolved photo</span>
                      <input type="file" accept="image/*" onChange={handleProofImageSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Resolution Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Resolution Note / Action Taken
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Cleaned up garbage with 3 neighbors and municipal truck collected bags..."
                  rows={3}
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  required
                />
              </div>

              {/* Submit button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {resolving ? <Loader2 size={16} className="animate-spin" /> : "Confirm Resolved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPostDetail;
