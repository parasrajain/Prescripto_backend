import validator from "validator";
// import bcrypt from "bcrypt";
import bcrypt from 'bcryptjs';
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctormodel.js";
import appointmentModel from "../models/appointmentmodel.js";
import razorpay from 'razorpay'

// api to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Missing details",
      });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Enter a strong password",
      });
    }

    // hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// api for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "user doest not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({
        success: true,
        token,
      });
    } else {
      res.json({
        success: false,
        message: "Invalid Password",
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");

    res.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.log("error in auth user");
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({
        success: false,
        message: "Data Missing",
      });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // uploat image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageUrl = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageUrl });
    }

    res.json({
      success: true,
      message: "Profile Updated",
    });
  } catch (error) {
    console.log("error in auth user");
    res.json({
      success: false,
      message: error.message,
    });
  }
};



// api to book appointments
// const bookAppointment = async (req, res) => {
//   try {
//     const { userId, docId, slotDate, slotTime } = req.body;

//     const docData = await doctorModel.findById(docId).select("-password");

//     if (!docData.available) {
//       return res.json({
//         success: false,
//         message: "Doctor not available",
//       });
//     }

//     let slots_booked = docData.slots_booked;
//     // checking for slots availability
//     if (slots_booked[slotDate]) {
//       if (slots_booked[slotDate].includes(slotTime))  {
//         return res.json({
//           success: false,
//           message: "Slot not available",
//         });
//       } else {
//         slots_booked[slotDate].push(slotDate);
//       }
//     }
//     else{
//         slots_booked[slotDate]=[];
//         slots_booked[slotDate].push(slotTime)
        
//     }

//     const userData=await userModel.findById(userId).select('-password')
//     delete docData.slots_booked

//     const appointmentData={
//         userId,
//         docId,
//         userData,
//         docData,
//         amount:docData.fee,
//         slotTime,
//         slotDate,
//         date:Date.now()
//     }

//     const newAppointment = new appointmentModel(appointmentData)
//     await newAppointment.save()

//     // save new slot data in docData
//     await doctorModel.findByIdAndUpdate(docId,{slots_booked})
//     res.json({
//         success:true,
//         message:'Appointment Booked'
//     })


//   } catch (error) {
//     console.log("error in auth user");
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Fetch doctor data
    const docData = await doctorModel.findById(docId).select("-password");

    // Check if the doctor is available
    if (!docData.available) {
      return res.json({
        success: false,
        message: "Doctor not available",
      });
    }

    let slots_booked = docData.slots_booked;

    // Check if the slot is already booked
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({
          success: false,
          message: "Slot not available",
        });
      } else {
        // Add the new slot time to the existing date
        slots_booked[slotDate].push(slotTime); // Fixed: Push slotTime instead of slotDate
      }
    } else {
      // Create a new entry for the date and add the slot time
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime); // Fixed: Push slotTime instead of slotDate
    }

    // Fetch user data
    const userData = await userModel.findById(userId).select("-password");

    // Remove slots_booked from docData to avoid redundancy in appointment data
    delete docData.slots_booked;

    // Create appointment data
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount:docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    // Save the new appointment
    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Update the doctor's slots_booked data
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Return success response
    res.json({
      success: true,
      message: "Appointment Booked",
    });
  } catch (error) {
    console.log("Error in booking appointment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
}

// api to get user appointments in fronts for my appointment pages
const listappointments=async(req,res)=>{
  try{
    const {userId}=req.body
    const appointments=await appointmentModel.find({userId})
    res.json({
      success:true,
      appointments
    })

  }catch (error) {
    console.log("Error in booking appointment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
}

// api to cancel appointment
const cancelAppointment=async(req,res)=>{
  try{
    const{userId,appointmentId}=req.body
    const appointmentData=await appointmentModel.findById(appointmentId)
    // verify appointment user
    if(appointmentData.userId!=userId)
    {
      return res.json({
        success:false,
        message:'Unauthorised Action'
      })
    }
    // releasing doc slot
    const {docId,slotDate,slotTime}=appointmentData
    const docData=await doctorModel.findById(docId)

    let slots_booked=docData.slots_booked
    slots_booked[slotDate]=slots_booked[slotDate].filter(e=>e!==slotTime)

    await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    res.json({
      success:true,
      message:'Appointment cancelled'
    })

  }catch (error) {
    console.log("Error in booking appointment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
}

// api to pay using razorpay
const razorpayInstance=new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_SECRET_ID
})

const paymentRazorpay=async (req,res)=>{
  try{
    const {appointmentId}=req.body
  const appointmentData= await appointmentModel.findById(appointmentId)
  if(!appointmentData || appointmentData.cancelled)
  {
    return res.json({
      success:false,
      message:'Appointment not found'
    })
  }
  // creating options for payment
  const options = {
    amount:appointmentData.amount*100,
    currency:process.env.CURRENCY,
    receipt:appointmentId
  }
  // creation of an order
  const order = await razorpayInstance.orders.create(options)
   res.json({
    success:true,
    order
  })

  }catch (error) {
    console.log("Error in booking appointment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }

}

// api to verify payment of razorpay
const verifyRazorpay=async (req,res)=>{
  try{
    const {razorpay_order_id}=req.body
    const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)

    // console.log(orderInfo,'info');
    if(orderInfo.status==='paid')
    {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
      res.json({
        success:true,
        message:'Payment Successfull'
      })
    }
    else{
      res.json({
        success:false,
        message:'Payment Failed'
      })

    }

    

  }
  catch (error) {
    console.log("Error in booking appointment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
}

export { registerUser, loginUser, getProfile, updateProfile,bookAppointment,listappointments,cancelAppointment,paymentRazorpay ,verifyRazorpay };
