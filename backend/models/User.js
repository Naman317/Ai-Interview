import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:function(){
            return !this.googleId
        }
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    preferredRole:{
        type:String,
        default:"MERN Stack Developer"
    },
    // CV Information
    cvUrl:{
        type:String,
        default:null
    },
    cvFileName:{
        type:String,
        default:null
    },
    cvParsed:{
        skills:[String],
        experience:[
            {
                title:String,
                company:String
            }
        ],
        projects:[String],
        education:[String],
        summary:String,
        yearsOfExperience:Number,
        technicalKeywords:[String],
        parsedAt:Date
    },
    // Interview Statistics
    totalInterviews:{
        type:Number,
        default:0
    },
    averageScore:{
        type:Number,
        default:0
    },
    interviewSessions:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Session"
        }
    ],
    completedQuestions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ]
},{
    timestamps:true
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return ;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});


userSchema.methods.matchPassword=async function(enteredPassword){
    if(!this.password){
        return false
    }
    return await bcrypt.compare(enteredPassword,this.password)
}
const User=mongoose.model("User",userSchema)
export default User