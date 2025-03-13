import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctormodel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentmodel.js'
import userModel from '../models/userModel.js'

// doctor adding
const addDoctor = async(req,res)=>{

    try{
        const {name,email,password,speciality,degree,experience,about,fees,address}=req.body
        const imageFile=req.file

        // console.log({name,email,password,speciality,degree,exprience,about,fees,address},imageFile)

        // checking data is complete or not
        if(!name || !email || !password || !speciality || !degree || !experience  || !about  ||  !fees  || !address || !imageFile)
        {
            return res.json({
                success:false,
                message:"Missing details"
            })
        }

        // validate email
        if(!validator.isEmail(email)){
            return res.json({
                success:false,
                message:"enter a valid email"
            })
        }

        // validate strong password
        if(password.length <8){
            return res.json({
                success:false,
                message:"enter a strong password"
            })
        }

        // hashing pass
        const salt= await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)
        console.log(hashedPassword);
        

        // upload img to cloudinary
        const imageUpload=await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
        const imageUrl=imageUpload.secure_url

        const doctorData={
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address:JSON.parse(address),
            date:Date.now()
        }
        const newDoctor=new doctorModel(doctorData)
        console.log(newDoctor)
        await newDoctor.save()
          res.json({
            success:"true",
            message:"Doctor added"
          })
         
    }
    catch(error)
    {
        // console.log("not working")
        res.json({
            success:"false",
            message:error.message

        })
    }

}

// api for admin login
const loginAdmin= async (req,res)=>{
    try{
        const {email,password}=req.body

        if(email===process.env.ADMIN_EMAIL  &&  password===process.env.ADMIN_PASSWORD)
        {
             const token =jwt.sign(email + password , process.env.JWT_SECRET)
            res.json({success:true,token})

        }
        else{
            res.json({
                success:false,
                message:"Invalid credentials"
    
              })   
        }

    }
    catch(error)
    {
    // console.log("not working")
    res.json({
        success:false,
        message:error.message

      })
     }
}

// api to get all doctor list
// const allDoctors = async(req,res)=>{
//     try{
//         const doctors=await doctorModel.find({}).select('-password')
//         res.json({
//             success:true,
//             doctors
//         })

//     }catch(error){
//         res.json({
//             success:false,
//             message:error.message
    
//           })

//     }

// }

const allDoctors = async (req, res) => {
    try {
      const doctors = await doctorModel.find({}).select('-password');
      if (!doctors) {
        return res.status(404).json({
          success: false,
          message: 'No doctors found',
        });
      }
  
      res.status(200).json({
        success: true,
        doctors,
      });
    } catch (error) {
      console.error('Error fetching doctors:', error); // Log the error
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  // api to get appointment list

  const appointmentAdmin = async (req,res)=>{
    try{
      const appointments = await appointmentModel.find({})
      console.log(appointments);
      
      res.json({
        success:true,
        appointments
      })

    }catch (error) {
      // console.error('Error fetching doctors:', error); // Log the error
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }

  }

  // cancel appoint ment for admin
  // const appointmentCancel=async(req,res)=>{
  //   try{
  //     const{appointmentId}=req.body
  //     const appointmentData=await appointmentModel.findById(appointmentId)
      
  //     const {docId,slotDate,slotTime}=appointmentData
  //     const docData=await doctorModel.findById(docId)
  
  //     let slots_booked=docData.slots_booked
  //     slots_booked[slotDate]=slots_booked[slotDate].filter(e=>e!==slotTime)
  
  //     await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
  
  //     await doctorModel.findByIdAndUpdate(docId,{slots_booked})
  
  //     res.json({
  //       success:true,
  //       message:'Appointment cancelled'
  //     })
  
  //   }catch (error) {
  //     console.log("Error in booking appointment:", error);
  //     res.json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }
  const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        console.log('id:',appointmentId);
        

        // Check if appointment exists
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({
                success: false,
                message: 'Appointment not found',
            });
        }

        // Destructure appointment data
        const { docId, slotDate, slotTime } = appointmentData;

        // Check if doctor exists
        const docData = await doctorModel.findById(docId);
        if (!docData) {
            return res.json({
                success: false,
                message: 'Doctor not found',
            });
        }

        // Update slots_booked
        let slots_booked = docData.slots_booked;
        if (!slots_booked[slotDate]) {
            slots_booked[slotDate] = [];
        }
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        // Mark appointment as cancelled
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Update doctor's slots_booked
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Send success response
        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
        });

    } catch (error) {
        console.log("Error in canceling appointment:", error);
        res.json({
            success: false,
            message: 'Failed to cancel appointment. Please try again later.',
        });
    }
};

// api to show dashboard data in adminn
const adminDashboard=async(req,res)=>{
  try{
    const doctors=await doctorModel.find({})
    const users = await userModel.find({})
    const appointments= await appointmentModel.find({})

    const dashData={
      doctors:doctors.length,
      appointments:appointments.length,
      patients:userModel.length,
      latestAppointments:appointments.reverse().slice(0,5)


    }
    res.json({
      success:true,
      dashData
    })

  }
  catch (error) {
    console.log("Error in canceling appointment:", error);
    res.json({
        success: false,
        message: error.message,
    });
}

}



export {addDoctor, loginAdmin,allDoctors,appointmentAdmin,appointmentCancel,adminDashboard};