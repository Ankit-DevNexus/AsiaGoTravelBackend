import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";

export const protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization && 
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ") [1];
        }
        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized, no token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModel.findById(decoded.id).select("-password");

        if(!req.user) {
            return res.status(404).json({success: false, message: "User not found"});
        }

        next()
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({
            success: false,
            message: "Not Authorized, invalid token"
        });
    }
};

export const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access Denied- Admins only"
        });
    }
};