import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";//for handling error
import { User } from "../models/users.model.js";//to communicate with database
import { uploadOnCloudinary } from "../utils/claudinary.js";//for uploading images on third party sever
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async function(userId) {
    try {
        const user = await User.findById(user._id);
        const AccessToken = await user.generateAccessToken();
        const RefreshToken = await user.generateRefreshToken();
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});

        return {AccessToken, RefreshToken};
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access token and refresh token");
    }
    

    
}

const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    // validate the condition 
    // check if user already exist- from email, username
    // check for images and avatar
    // upload them in cloudinary
    // create user object - create entry in db
    // remove password and refresh token firld from response
    // check for user creation
    // return response;
    

    //getting user detail
    const {username, email, fullname,password} = req.body;
     console.log(req.body)
    // console.log("email :", email);
    
    // validation
    if(
        [fullname, username, email, password].some((field) => field?.trim() === "") 
    ){
        throw new ApiError(404, "fullname is required")
    }

    //checking if user already exist
    const existedUser = await User.findOne({
      $or: [{username},{email}]
    });

    if(existedUser){
        throw new ApiError(409, "user with this email and username already exist")
    }
//console.log(req.files);
    //checking for image and avatar
//     const avatarLocalPath = req.files?.avatar[0].path;
// console.log(avatarLocalPath);
//     const coverImageLocalPath = req.files?.coverImage[0].path;//files comes from multer middleware

//     if(!avatarLocalPath){
//         throw new ApiError(404, " Avatart is required")
//     }

//     // //uploading in cloudinary
//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//      if(!avatarLocalPath){
//         throw new ApiError(404, " Avatar is required")
//     }

    //creating user object
    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        // avatar: avatar.url || "" ,
        // coverImage: coverImage?.url || "",
    });

    //console.log(user)

    //removing password and refresh tokens
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    console.log(createdUser);

    //checking is user created or not
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    //returning response
    return res.status(201).json(
        new ApiResponse(200, createdUser, " user registered successfully.")
    )

});

const loginUser = asyncHandler(async(req, res) => {
    //get data from request body
    const {email, username, passsword} = req.body;
    if(!username && !email){
        throw new ApiError(404, "usernmae or email is required");
    };

    //finding the users existence
    const user = await User.findOne({//this User comes from mongodb 
        $or: [{username}, {email}]
    });
    if(!user){
        throw new ApiError(404, "user not found")
    }
    //validating password 
    const isPasswordValid = await user.isPasswordCorrect(passsword);// this user is from local object
    if(!isPasswordValid){
        throw new ApiError(404, "Invalid password")
    };

    //generating the tokens
    const {AccessToken, RefreshToken} = generateAccessAndRefreshTokens(user._id);

    //checking is refreshtokens is updated or not
    const loggedInUser = await User.findById(user._id);

    //creating cookies
     const options = {// it can only managed by the server(backend);
        httpOnly: true,
        secure: true
     }  

     return res.status(200)
     .cookie("accessToken", AccessToken, options)
     .cookie("refreshToken", RefreshToken, options)
     .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,AccessToken, RefreshToken

            },
            "User logged in successfully",
        )
     )

})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,//returns updateed value
        }
    );

    const options = {// it can only managed by the server(backend);
        httpOnly: true,
        secure: true
     } 

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logged out")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if(!token) {
        throw new ApiError(401, "unathorised request")
    }

   try {
     const decodeToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
 
     const user = await User.findById(decodeToken?._id);
     console.log(user);
     if(!user){
         throw new ApiError("Invalid refresh token")
     }
 
     if(token !== user?.refreshToken){
         throw new ApiError(404, "Refresh Token expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     };
 
     const newRefreshToken = await generateAccessAndRefreshTokens(user?._id);
 
     return res.status(200).cookie("accessToken", AccessToken, options).cookie("refreshToken", newRefreshToken, options).json(
         200,
         {
         AccessToken, newRefreshToken,
         },
        "Access token refrshed"
     )
   } catch (error) {
     throw new ApiError(401, error.message || "Invalid refersh token")
   }
})

const changeCurrentPassword = asyncHandler(async(req, es) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    user.password = newPassword;

    user.save({validateBeforeSave: false});

    return res.status(200).json(200, {}, "Password changes successfully")
});

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "current user fetched"));
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
    {
        $set: {fullname, email}
    },
    {
        new: true
    }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Account updated successfully"));
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file.path;

    if(!avatarLocalPath){
        throw new ApiError(404, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while loading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {new: true}
    ).select("-password");
    
    return res.status(200).json(new ApiResponse (200, user, "avatar updated"));

});

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file.path;

    if(!acoverImageLocalPath){
        throw new ApiError(404, "cover image file is missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while loading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
               coverImage : coverImage.url,
            }
        },
        {new: true}
    ).select("-password");

    return res.status(200).json(new ApiResponse(200,  user, "cover image updated"),)

})

const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params;

    if(!username){
        throw new ApiError(400, "username is missing")
    };

    const channel = await User.aggregate([
        {
            $match: username?.toLowerCase(),
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
         {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberrsCount :{
                    $size: "$subscribers"
                },
                subscribedCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed :{
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedCount: 1,
                isSubscribed: 1,
                // avatar: 1,
                // coverImage: 1,
            }
        }
    
    ]);

    if(!channel.length){
        throw new ApiError(404, "channel doesnt exist")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "channel fetched successfully"));
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from:"videos",////going user to videos to get video id
                localField: "watchHistory",
                foreignField: "_id" ,
                as: "watchHistory",
                pipeline:[
                    {
                    $lookup:{//from videos to users for getting owner name
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [{
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1,
                            }
                            }]
                        }
                    },
                    {
                    $addFields: {
                        owner: {
                         $first: "$owner",
                            }
                        }
                    }
                ]
            }
        }
        
    ] 
    );

    return res.status(200),json(new ApiResponse(200, user[0].watchHistory, "watch history fetched"))
})
export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,getWatchHistory
} ;

