const mongoose=require('mongoose');

const messageschema=new mongoose.Schema({
    conversation:{type:mongoose.Schema.Types.ObjectId,ref:'Conversation',required:true},
    sender:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    receiver:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    content:{type:String,required:false},
    imageOrVideoUrl:{type:String},
    contentType:{type:String,enum:['text','image','video'],default:'text'},
    reactions:[{
        user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
        emoji:{type:String}
    }],
    messageStatus:{type:String,enum:['sent','delivered','read'],default:'sent'},
},{timestamps:true});
const Message = mongoose.model('Message',messageschema);
module.exports = Message;