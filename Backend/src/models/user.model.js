import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            unique: true, 
            required: true 
        },
        password: { 
            type: String, 
            required: true 
        }, 
        avatar: {
            type: String, 
        },
        location: {
            type: { type: String, default: "Point" },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        contact: { 
            type: String,  
        }, 
        bio: { 
            type: String,
        }, 
        trustScore: { 
            type: Number, 
            default: 0 
        }, // For future trust badges
        refreshToken: {
            type: String,
        }
    }, {timestamps: true}
);

UserSchema.index({ location: '2dsphere' }); // Enable GeoQueries

UserSchema.pre("save", async function (next)
    {
        if(!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password, 10)
        next()
    }
);

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', UserSchema);