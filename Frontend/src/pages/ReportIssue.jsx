import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Upload, X, AlertTriangle, Loader2 } from "lucide-react";
import LocationPicker from "../components/LocationPicker";

const CATEGORIES = [
  "Garbage & Waste",
  "Roads & Potholes",
  "Drainage & Water",
  "Streetlights & Electricity",
  "Animal Welfare",
  "Sanitation",
  "Other"
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    lat: "",
    lng: "",
    address: ""
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLocationChange = ({ lat, lng, address }) => {
    setFormData((prev) => ({ ...prev, lat, lng, address }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (imageFiles.length + files.length > 5) {
      toast.warn("You can upload up to 5 photos");
      return;
    }

    const updatedFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(updatedFiles);

    // Generate previews
    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, category, lat, lng, address } = formData;

    if (!title.trim() || !description.trim() || !category) {
      return toast.error("Please fill in the title, description, and category");
    }

    if (!lat || !lng) {
      return toast.error("Please select the issue location on the map");
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("title", title.trim());
      data.append("description", description.trim());
      data.append("category", category);
      data.append("address", address || "");
      data.append("coordinates", JSON.stringify([lng, lat]));

      imageFiles.forEach((file) => {
        data.append("images", file);
      });

      const res = await axios.post("/api/v1/community-posts", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      if (res.data?.success) {
        toast.success("Community issue reported successfully!");
        navigate("/community");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white via-sky-50 to-sky-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Community Feed
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report a Local Issue</h1>
              <p className="text-sm text-gray-500">
                Help your neighborhood identify and resolve civic problems together.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Deep pothole causing accidents near Metro Station"
                required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="" disabled>Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the severity, location landmarks, and what assistance is needed..."
                required
                rows={4}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Photos upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Photos (Up to 5)
              </label>
              <div className="mt-1 flex flex-col gap-3">
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50">
                  <Upload size={28} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Click to upload photos</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB each</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-2">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location on Map <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Drag the pin or type an address to specify the exact issue location.
              </p>
              <LocationPicker
                lat={formData.lat}
                lng={formData.lng}
                address={formData.address}
                setLocation={handleLocationChange}
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Publishing Report...
                  </>
                ) : (
                  "Publish Local Issue Report"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
