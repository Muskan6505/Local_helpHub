import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const EditRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        status: "",
        priority: "",
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axios.get(`/api/v1/help-requests/${id}`, {
                withCredentials: true,
                });
                const { title, description, category, status, priority } = res.data.data;
                setFormData({ title, description, category, status, priority });
                setLoading(false);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load request");
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/v1/help-requests/${id}`, formData, {
                withCredentials: true,
            });
            toast.success("Request updated successfully");
            navigate("/myrequests");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update request");
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-r from-white via-sky-50 to-sky-50 pt-8">
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-bold mb-4">Edit Help Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                    required
                >
                <option value="">Select</option>
                <option value="Medical">Medical</option>
                <option value="Medicines">Medicines</option>
                <option value="Groceries">Groceries</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="other">Other</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                    required
                >
                <option value="">Select</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="fulfilled">Fulfilled</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium">Priority</label>
                <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                    required
                >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                </select>
            </div>

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
                Save Changes
            </button>
            </form>
        </div>
        </div>
    );
};

export default EditRequest;
