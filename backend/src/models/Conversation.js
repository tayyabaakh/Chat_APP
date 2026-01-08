const mongoose = require('mongoose');
const conversationschema= new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage:{type:mongoose.Schema.Types.ObjectId, ref:'Message'},
    unreadCounts: {type:Number, default:0},
},{timestamps:true});
const Conversation = mongoose.model('Conversation', conversationschema);
module.exports = Conversation;