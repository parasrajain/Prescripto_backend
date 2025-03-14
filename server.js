import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoutes.js'
import doctorRouter from './routes/doctorRoutes.js'
import userRouter from './routes/userRoutes.js'


// app config
const app=express()
const port =process.env.PORT || 4000;
connectDB()
connectCloudinary()


// middleware
app.use(express.json())
app.use(cors())


const cors = require('cors');

app.use(cors({
  origin: ['https://prescripto-frontend-7-8coi.onrender.com'], // Allow frontend
  credentials: true,
}));

app.use(cors({
  origin: ['https://prescripto-admin-1-35dq.onrender.com'], // Your frontend URL
  credentials: true
}));


// api end point
app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)



app.get('/',(req,res)=>{
    res.send('API WORKING')
})

app.listen(port,'0.0.0.0',()=>{
    console.log("Server started at",port)
})