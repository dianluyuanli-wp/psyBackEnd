let mongoose = require('mongoose');

//  测试动物类
let animalSchema = new mongoose.Schema({
    name:String,
    type:String
});
exports.Animal = mongoose.model("Animal",animalSchema);

//  提交信息类
let bookInfo = new mongoose.Schema({
    tel: Number,
    date: String,
    time: String,
    text: String,
    name: String,
    avatar: String,
    nickName: String
});
exports.BookInfo = mongoose.model("BookInfo", bookInfo);


