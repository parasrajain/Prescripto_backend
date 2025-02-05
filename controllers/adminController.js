import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctormodel.js'

// doctor adding
const addDoctor = async(req,res)=>{

    try{
        const {name,email,password,speciality,degree,experience,about,fees,address}=req.body
        const imageFile=req.file

        // console.log({name,email,password,speciality,degree,exprience,about,fees,address},imageFile)

        // checking data is complete or not
        if(!name || !email ||!password || !speciality || !degree || !experience  || !about  ||  !fees  || !address || !imageFile)
        {
            return res.json({
                success:false,
                message:"missing details"
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
            message:"doctor added"
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

export {addDoctor}