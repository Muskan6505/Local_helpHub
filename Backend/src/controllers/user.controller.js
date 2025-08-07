import {User} from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/AsyncHandler.js';
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';

const options = {
    httpOnly: true,
    secure: false
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, location, contact, bio } = req.body;
    if (!name || !email || !password || !location || !contact) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email});
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = new User({
        name,
        email,
        password,
        location,
        contact,
        bio
    });
    await user.save();

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
        new ApiResponse(
            200,
            user,
            "User registered successfully"
        )
    );
}); 

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)    
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User logged in successfully"
        )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    res
    .clearCookie('refreshToken', options)
    .clearCookie('accessToken', options)
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "User logged out successfully"
        )
    );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, contact, bio } = req.body;

    if (!name || !contact) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { name, contact, bio },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User profile updated successfully"
        )
    );
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "User account deleted successfully"
        )
    );
});

const refreshUserToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    res
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', newRefreshToken, options)
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Access token refreshed successfully"
        )
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const file = req.file;
    if (!file) {
        throw new ApiError(400, "Avatar file is required");
    }
    const result = await uploadOnCloudinary(file.path);
    if (!result) {
        throw new ApiError(500, "Cloudinary upload failed");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { avatar: result?.url },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    );
});

const deleteAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(user.avatar){
        await deleteFromCloudinary(user.avatar);
    }

    user.avatar = null;
    await user.save();
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar deleted successfully"
        )
    );
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current and new passwords are required");
    }

    const user = await User.findById(userId);

    if (!user || !(await user.isPasswordCorrect(currentPassword))) {
        throw new ApiError(401, "Invalid current password");
    }

    user.password = newPassword;
    await user.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Password changed successfully"
        )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -refreshToken'); 
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User profile retrieved successfully"
        )
    );  
});

const userProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User profile retrieved successfully"
        )
    )
});

export {
    registerUser,
    loginUser,
    logoutUser,
    updateUserProfile,
    deleteUserAccount,
    refreshUserToken,
    updateAvatar,
    deleteAvatar,
    changePassword,
    getUserProfile,
    userProfile
}