import { HelpRequest } from "../models/helpRequest.model.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const createRequest = asyncHandler(async (req, res) => {
    const { title, description, category, coordinates, priority } = req.body;
    const requester = req.user._id;

    if (!title || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new ApiError(400, "Title and valid coordinates [lng, lat] are required");
    }

    const newRequest = await HelpRequest.create({
        title,
        description,
        category,
        location: {
        type: "Point",
        coordinates: coordinates,
        },
        requester,
        priority: priority || 'medium',
    });

    res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            newRequest, 
            "Help request created successfully"
        )
    );
});

const getAllRequests = asyncHandler(async (req, res) => {
    const { lng, lat, radius } = req.query;

    let query = {};

    if (lng && lat && radius) {
        query.location = {
        $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radius) / 6378.1], // radius in km
        },
        };
    }

    const requests = await HelpRequest.find(query).populate("requester");

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            requests, 
            "Help requests fetched successfully"
        )
    );
});


const getRequestById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const request = await HelpRequest.findById(id).populate("requester");

    if (!request) {
        throw new ApiError(404, "Help request not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            request, 
            "Request fetched successfully"
        )
    );
});


const updateRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await HelpRequest.findById(id);

    if (!existing) {
        throw new ApiError(404, "Help request not found");
    }

    if (existing.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this request");
    }

    const allowedUpdates = ['title', 'description', 'category', 'status', 'coordinates', 'priority'];
    allowedUpdates.forEach(field => {
        if (req.body[field]) {
        if (field === 'coordinates') {
            existing.location.coordinates = req.body.coordinates;
        } else {
            existing[field] = req.body[field];
        }
        }
    });

    await existing.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            existing, 
            "Help request updated successfully"
        )
    );
});


const deleteRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const request = await HelpRequest.findById(id);

    if (!request) {
        throw new ApiError(404, "Help request not found");
    }

    if (request.requester.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this request");
    }

    await request.deleteOne();

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            null, 
            "Help request deleted successfully"
        )
    );
});

const getFilteredRequests = asyncHandler(async (req, res) => {
    const {
        status,
        category,
        startDate,
        endDate,
        lng,
        lat,
        radius,
        tags,
        keyword,
        priority
    } = req.query;

    const filter = {};

    // ✅ Status filter
    if (status) {
        filter.status = status;
    }

    // ✅ Category filter
    if (category) {
        filter.category = category;
    }

    // ✅ Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
        }
    }

    // ✅ Tags filter (assumes array of strings and your model has a 'tags' field)
    if (tags) {
        const tagsArray = tags.split(',');
        filter.tags = { $in: tagsArray };
    }

    // ✅ Keyword search (title/description)
    if (keyword) {
        filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        ];
    }

    // ✅ Location filter (geospatial query)
    if (lng && lat && radius) {
        filter.location = {
        $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radius) / 6378.1], // radius in km
        },
        };
    }

    if( priority ) {
        filter.priority = priority;
    }

    const requests = await HelpRequest.find(filter).populate("requester");

    res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            requests, 
            "Filtered help requests fetched successfully"
        )
    );
});

export {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
    getFilteredRequests
};
