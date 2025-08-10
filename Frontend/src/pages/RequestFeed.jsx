import React, { useEffect, useState } from "react";
import axios from "axios";
import RequestCard from "../components/RequestCard";
import { toast } from "react-toastify";
import { Funnel } from "lucide-react";
import { useSelector } from "react-redux";

const RequestFeed = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        category: "",
        startDate: "",
        endDate: "",
        radius: 5,
        priority: "",
    });
    const {user} = useSelector((state) => state.user);
    const userId = user ? user._id : null;

    const [location, setLocation] = useState({ lat: null, lng: null });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                fetchRequests({ lat: latitude, lng: longitude, radius: 5 });
            },
            (error) => {
                console.error(error);
                toast.error("Location access denied");
                setLoading(false);
            }
        );
    }, []);

    const fetchRequests = async (customFilters = {}) => {
        try {
            setLoading(true);
            const res = await axios.get("/api/v1/help-requests/filter/query", {
                params: {
                    ...customFilters,
                    keyword,
                },
                withCredentials: true,
            });

            setRequests(res.data.data.filter(req => req.requester._id !== userId));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch help requests");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchRequests({
            ...filters,
            lat: location.lat,
            lng: location.lng,
            radius: filters.radius,
        });
    };

    const handleFilterApply = () => {
        fetchRequests({
            ...filters,
            keyword,
            lat: location.lat,
            lng: location.lng,
            radius: filters.radius,
        });
        setFiltersOpen(false);
    };

    return (
        <div className="p-6 bg-gradient-to-r from-white to-sky-50">
            <div className="border-1 border-black rounded-2xl p-2 mb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex gap-2 w-full md:w-2/3">
                        <input
                            type="text"
                            placeholder="Search by title or description"
                            className="w-full border px-3 py-2 rounded-md"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Search
                        </button>
                    </div>

                    <button
                        className="border px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-100"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                        <Funnel size={16} />
                        Filters
                    </button>
                </div>

                {filtersOpen && (
                    <div className="grid md:grid-cols-3 gap-4 bg-gray-100 p-4 rounded-xl mb-6">
                        {/* Category Dropdown */}
                        <select
                            className="border px-3 py-2 rounded-md"
                            value={filters.category}
                            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                        >
                            <option value="">All Categories</option>
                            <option value="Medical">Medical</option>
                            <option value="Medicines">Medicines</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="other">Other</option>
                        </select>

                        {/* Status Dropdown */}
                        <select
                            className="border px-3 py-2 rounded-md"
                            value={filters.status}
                            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                        >
                            <option value="">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="fulfilled">Fulfilled</option>
                        </select>

                        {/* Priority Dropdown */}
                        <select
                            className="border px-3 py-2 rounded-md"
                            value={filters.priority}
                            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="border px-3 py-2 rounded-md"
                                value={filters.startDate}
                                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">End Date</label>
                            <input
                                type="date"
                                className="border px-3 py-2 rounded-md"
                                value={filters.endDate}
                                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">
                                Radius: {filters.radius} km
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={50}
                                step={1}
                                value={filters.radius}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, radius: parseInt(e.target.value) }))
                                }
                            />
                        </div>

                        <div className="md:col-span-3 flex justify-end">
                            <button
                                onClick={handleFilterApply}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <p className="text-gray-500">Loading requests...</p>
            ) : requests.length === 0 ? (
                <p className="text-gray-500">No requests found.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <RequestCard key={req._id} request={req} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RequestFeed;