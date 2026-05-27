import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type : String,
        required : true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true//it hepls in searching
    },
    email: {
        type : String,
        required : true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type : String,
        required : true,
        lowercase: true,
        trim: true,
    },
    // avatar: {
    //     type: String,// cloudnary- a third party library 
    //     required: true,
    // },
    // coverImage:{
    //     type: String
    // },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }


},{timestamps: true});

userSchema.pre("save", async function (next){
    
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare("password", this.password)
};

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id: this.id,
            username: this.username,
            email: this.email,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
};

userSchema.methods.generateRefreshToken = function (){
    jwt.sign(
        {
            _id: this.id,
            username: this.usernname,
            email: this.email,
            fullname: this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User", userSchema) 