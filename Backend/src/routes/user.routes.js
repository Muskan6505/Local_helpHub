import { Router } from "express";

const router = Router();
import {
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
} from "../controllers/user.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/update").patch(verifyJWT, updateUserProfile)
router.route("/").delete(verifyJWT, deleteUserAccount)
router.route("/refresh").get(refreshUserToken)
router.route("/avatar/update").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/avatar").delete(verifyJWT, deleteAvatar)
router.route("/password/change").patch(verifyJWT, changePassword)
router.route("/").get(verifyJWT, getUserProfile)
router.route("/:userId").get(verifyJWT, userProfile)

export default router;