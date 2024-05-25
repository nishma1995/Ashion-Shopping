const authcheck=(req,res,next)=>{
    if(!req.user){
       console.log("checkcheck"+req.user)
    res.redirect('/login')
    }else{
    next()
    }
    }