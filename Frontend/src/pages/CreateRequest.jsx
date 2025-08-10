import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import LocationPicker from "../components/LocationPicker";

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    lat: "",
    lng: "",
    address: "",
  });

  const setLocation = ({ lat, lng, address }) =>
    setFormData((prev) => ({ ...prev, lat, lng, address }));

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, category, priority, lat, lng } = formData;

    if (!lat || !lng || !title) return toast.error("Title and location are required");

    try {
      const res = await axios.post(
        "/api/v1/help-requests",
        {
          title,
          description,
          category,
          priority,
          coordinates: [lng, lat],
        },
        { withCredentials: true }
      );
      toast.success("Help request created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    }
  };

  return (
    <div className="bg-gradient-to-r from-white via-sky-50 to-sky-100 pt-10">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Help Request</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            required
            onChange={handleChange}
            placeholder="Title"
            className="w-full border px-4 py-2 rounded"
          />

          <textarea
            name="description"
            onChange={handleChange}
            placeholder="Description"
            className="w-full border px-4 py-2 rounded resize-none"
            rows={3}
          />

          <select
            name="category"
            onChange={handleChange}
            value={formData.category}
            className="w-full border px-4 py-2 rounded bg-white"
            required
          >
            <option value="" disabled>Select Category</option>
            <option value="Medical">🩺 Medical</option>
            <option value="Medicines">💊 Medicines</option>
            <option value="Groceries">🛒 Groceries</option>
            <option value="Food">🍽️ Food</option>
            <option value="Transport">🚗 Transport</option>
            <option value="Other">🔧 other</option>
          </select>

          <select
            name="priority"
            onChange={handleChange}
            value={formData.priority}
            className="w-full border px-4 py-2 rounded bg-white"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>

          <LocationPicker
            lat={formData.lat}
            lng={formData.lng}
            address={formData.address}
            setLocation={setLocation}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
