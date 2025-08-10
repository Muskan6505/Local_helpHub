import { Response } from "../models/response.model.js";
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/AsyncHandler.js';
import { User } from "../models/user.model.js";

const createResponse = asyncHandler(async(req, res) => {
    try {
        const { helpRequest, message } = req.body;
        const helper = req.user._id;

        const existing = await Response.findOne({ helpRequest, helper });
        if (existing) throw new ApiError(400, 'Already responded');

        const response = new Response({ helpRequest, message, helper });
        await response.save();
        res
        .status(201)
        .json(
            new ApiResponse(
                200,
                response,
                "Response sent successfully."
            )
        );
    } catch (err) {
        throw new ApiError(500,`Failed to send response: ${err.message}`);
    }
});

// Get all responses for a specific request
const getResponseByRequest = asyncHandler(async(req, res) => {
    try {
        const { helpRequest } = req.params;
        const responses = await Response.find({ helpRequest }).populate('helper');

        res
        .status(200)
        .json(
            new ApiResponse(
                200,
                responses,
                "Responses fetched successfully."
            )
        );
    } catch (err) {
        throw new ApiError (500, `Failed to fetch responses ${err.message }`);
    }
});


// Get all responses by logged-in user
const getMyResponses = async (req, res) => {
    try {
        const responses = await Response.find({ helper: req.user._id })
        .populate({
            path: 'helpRequest',
            populate: {
                path: 'requester', 
                model: 'User'      
            }
        });


        res
        .status(200)
        .json(
            new ApiResponse(
                200,
                responses,
                "Responses fetched successfully."
            )
        );
    } catch (err) {
        throw new ApiError(500, `Error fetching your responses: ${err.message}`);
    }
};


const updateResponseStatus = async (req, res) => {
    try {
        const { responseId } = req.params;
        const  {status} = req.body; 

        const response = await Response.findById(responseId).populate('helpRequest');
        if (!response) throw new ApiError(404, 'Response not found' );

        if (response.helpRequest.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this response' });
        }

        response.status = status;
        await response.save();

        res.status(200).json(
            new ApiResponse(
                200,
                response,
                'Response status updated'
            )
        );
    } catch (err) {
        throw new ApiError(500, `Status update failed: ${err.message}`);
    }
};

const checkIfResponseExists = async (req, res) => {
    try {
        const { helpRequestId } = req.params; 

        if (!helpRequestId) {
            throw new ApiError(400, "Help request ID is required.");
        }

        // Check if a response exists for this helper and help request
        const existingResponse = await Response.findOne({
            helpRequest: helpRequestId,
            helper: req.user._id
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { exists: !!existingResponse },
                existingResponse ? "Response already exists." : "No response found."
            )
        );
    } catch (err) {
        throw new ApiError(500, `Error checking response existence: ${err.message}`);
    }
};


export {
    createResponse,
    getMyResponses, 
    getResponseByRequest,
    updateResponseStatus,
    checkIfResponseExists
}