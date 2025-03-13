// import jwt from 'jsonwebtoken'

// // admin authentication middle ware 
// const authUser = async (req,res,next)=>{
//     try{
//         const {token}=req.headers
//         if(!token)
//         {
//             return res.json({
//                 succes:false,
//                 message:"Not Authorized Login again"

//             })
//         }
//     const token_decode=jwt.verify(token,process.env.JWT_SECRET)

//     req.body.userId=token_decode.id

//     next()
//     }
//     catch(error)
//     {
//     // console.log("not working")
//     res.json({
//         success:"false",
//         message:error.message

//       })
//      }

// }

// export default authUser

import jwt from 'jsonwebtoken'

// Admin authentication middleware
const authUser = async (req, res, next) => {
    try {
        // Check for token in the Authorization header
        // const authHeader = req.headers['authorization'];
        // const token = authHeader && authHeader.split(' ')[1];
        const {token}=req.headers
        // console.log(token);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized. Please login again."
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user id to the request
        req.body.userId = decoded.id;

        next();
    } catch (error) {
        console.error("Error during JWT verification:", error); // Log the error for debugging

        res.status(400).json({
            success: false,
            message: error.message // Sends error message from JWT
        });
    }
}

export default authUser;
