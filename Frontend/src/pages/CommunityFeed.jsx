import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Map as MapIcon,
  LayoutGrid,
  Loader2,
  Navigation,
  Compass
} from "lucide-react";
import CommunityPostCard from "../components/CommunityPostCard";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../GoogleMapsProvider";

const CATEGORIES = [
  "All",
  "Garbage & Waste",
  "Roads & Potholes",
  "Drainage & Water",
  "Streetlights & Electricity",
  "Animal Welfare",
  "Sanitation",
  "Other"
];

const STATUSES = ["All", "Reported", "In Progress", "Resolved"];

const mapContainerStyle = {
  width: "100%",
  height: "550px",
  borderRadius: "1rem"
};

const CommunityFeed = () => {
  const { isLoaded: isMapLoaded } = useGoogleMaps();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [radius, setRadius] = useState(15);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "map"
  const [selectedMapPost, setSelectedMapPost] = useState(null);

  // Fetch geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Default fallback
          setUserLocation({ lat: 28.6139, lng: 77.209 });
        }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.209 });
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory,
        status: selectedStatus,
        radius,
        keyword: keyword.trim(),
        sortBy
      };

      if (userLocation?.lat && userLocation?.lng) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await axios.get("/api/v1/community-posts", {
        params,
        withCredentials: true
      });

      if (res.data?.success) {
        setPosts(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load community issues");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, radius, keyword, sortBy, userLocation]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <AlertTriangle size={14} /> Community Problem Solving
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Local Issue Reporting
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-xl">
            Spot an issue in your locality? Report potholes, garbage piles, animal distress, or sanitation problems. Collaborate with neighbors to get them resolved.
          </p>
        </div>

        <Link
          to="/community/report"
          className="shrink-0 bg-white hover:bg-gray-100 text-blue-700 font-bold px-6 py-3.5 rounded-2xl transition shadow-md flex items-center gap-2 hover:scale-[1.02]"
        >
          <Plus size={18} />
          Report a Local Issue
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm mb-6 space-y-4">
        {/* Search & Radius row */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports by keyword, landmark, or description..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Radius Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <Compass size={14} className="text-blue-600" />
              <span>Radius:</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <Filter size={14} className="text-blue-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Newest First</option>
                <option value="upvotes">Most Supported</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-gray-200 rounded-xl p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-black"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === "map" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-black"
                }`}
              >
                <MapIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedStatus === st
                  ? "bg-indigo-100 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Fetching nearby community reports...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No issues reported in this area</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
            There are currently no active community issues matching your filters within {radius} km. Be the first to report a problem!
          </p>
          <Link
            to="/community/report"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Report an Issue
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <CommunityPostCard key={post._id} post={post} onPostUpdated={fetchPosts} />
          ))}
        </div>
      ) : (
        /* Map View */
        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-sm overflow-hidden">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation || { lat: 28.6139, lng: 77.209 }}
              zoom={12}
            >
              {/* User position */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  title="Your Location"
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  }}
                />
              )}

              {/* Issue Markers */}
              {posts.map((post) => {
                const [lng, lat] = post.location?.coordinates || [];
                if (!lng || !lat) return null;

                return (
                  <Marker
                    key={post._id}
                    position={{ lat, lng }}
                    onClick={() => setSelectedMapPost(post)}
                  />
                );
              })}

              {/* Info Window */}
              {selectedMapPost && (
                <InfoWindow
                  position={{
                    lat: selectedMapPost.location.coordinates[1],
                    lng: selectedMapPost.location.coordinates[0]
                  }}
                  onCloseClick={() => setSelectedMapPost(null)}
                >
                  <div className="p-1 max-w-xs">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 mb-1 inline-block">
                      {selectedMapPost.category}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                      {selectedMapPost.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {selectedMapPost.description}
                    </p>
                    <Link
                      to={`/community/${selectedMapPost._id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View Details & Volunteer →
                    </Link>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-[550px] flex items-center justify-center text-gray-400">
              Loading Google Maps...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
