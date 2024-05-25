
const dotenv=require('dotenv')
const cloudinary=require('cloudinary')


dotenv.config({path:'configuration.env'})

const cloud_name=process.env.CLOUD_NAME
const api_key=process.env.CLOUD_API_KEY
const api_secret=process.env.CLOUD_API_KEY  


cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_SECRET_KEY    
})



exports.uploads=(file,folder)=>{
        return new Promise(resolve=>{
            cloudinary.uploader.upload(file,(result)=>{
                resolve({
                    url:result.url,
                    id:result.public_id
                })

            },{
                resource_type:'auto',
                folder:folder
            })
        })
}