// import jwt from 'jsonwebtoken'

// // admin authentication middle ware 
// const authAdmin = async (req,res,next)=>{
//     try{
//         const {atoken} =req.headers
//         // console.log(atoken);
        
//         if(!atoken)
//         {
//             return res.json({
//                 succes:false,
//                 message:"Not Authorized Login againnnnn"

//             })
//         }
//     const token_decode=jwt.verify(atoken,process.env.JWT_SECRET);
//     if(token_decode!== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD)
//     {
//         return res.json({
//             succes:false,
//             message:"Not Authorized Login again"

//         })

//     }
//     next()
//     }
//     catch(error)
//     {
//     console.log("not working")
//     res.json({
//         success:false,
//         message:error.message

//       })
//      }

// }

// export default authAdmin


// // import jwt from 'jsonwebtoken';

// // const authAdmin = async (req, res, next) => {
// //     try {
// //         const authHeader = req.headers.authorization;
// //         console.log("Auth Header:", authHeader);
        
// //         if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //             return res.json({
// //                 success: false,
// //                 message: "Not Authorized. Login again"
// //             });
// //         }

// //         // Extract token from "Bearer <token>"
// //         const token = authHeader.split(" ")[1];

// //         // Verify token
// //         const decoded = jwt.verify(token, process.env.JWT_SECRET);

// //         // Check if the decoded email matches the admin email
// //         if (decoded.email !== process.env.ADMIN_EMAIL) {
// //             return res.json({
// //                 success: false,
// //                 message: "Not Authorized. Login again"
// //             });
// //         }

// //         next();
// //     } catch (error) {
// //         res.json({
// //             success: false,
// //             message: error.message
// //         });
// //     }
// // };

// // export default authAdmin;

import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers
        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin;