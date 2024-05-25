const dotenv = require("dotenv");
dotenv.config({ path:"./configuration.env"});
const passport=require('passport')
const GoogleStrategy=require('passport-google-oauth20')
const user = require("../model/user")


passport.serializeUser((user,done)=>
{
    console.log("sdrialize"+user)
    done(null,user._id)
})

passport.deserializeUser((id,done)=>
{
    user.findById(mongoose.Types.ObjectId(id)).then((user) => 
    {
        console.log("ddddsdrialize"+user)
        done(null,user)
    })
    

})

passport.use(
   new GoogleStrategy({
    //option for google strategy
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/google/redirect"

},(accessToken,refreshToken,profile,done)=>
{
    console.log("passport callback")
    console.log(profile)
    const email = profile.emails ? profile.emails[0].value : null;
    console.log(email)
    //check if user allready exists in our db
    user.findOne({email:email}).then((currentUser)=>
    {
        if(currentUser)
        {
            //allready a  have the user
            console.log("user is"+currentUser)
            done(null,currentUser)

        }
        else
        {
            //if not create a user
            new user({
                firstname:profile.displayName,
                googleId:profile.id,
                email:profile.emails ? profile.emails[0].value : null
        
            }).save().then((newUser)=>{
                console.log("new user created"+newUser)
                done(null,newUser)
            })
           
        }
        
    })
   
})

)

module.exports = passport;