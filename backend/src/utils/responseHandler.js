

const response=(res,statusCode,message,data=null)=>{
    if(!res){
        // response object is null or undefined
        console.log("response object is null");
        return;
    }
    // response structure
    const responseObject={

        status:statusCode < 400 ? 'success' : 'error',
        message,
        data
    }
    return res.status(statusCode).json(responseObject);
}
module.exports=response;