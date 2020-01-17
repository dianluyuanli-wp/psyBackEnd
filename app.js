var express=require('express');
var app =express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let mongoose = require('mongoose');
let ownTool = require('xiaohuli-package');
let { Animal, BookInfo } = require('./modle');

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
//设置跨域访问
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin",  req.headers.origin);
   res.header("Access-Control-Allow-Credentials", "true");
   res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,AccessToken");
   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
   res.header("X-Powered-By",' 3.2.1');
   res.header("Content-Type", "application/json;charset=utf-8");
   next();
});

mongoose.connect('mongodb://@127.0.0.1:27017/psy',
{ useNewUrlParser: true });

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('success!');
});

var domain = 'https://api.weixin.qq.com/sns/jscode2session';
var para = {
    appid: 'wx8b27b1c81eecd334',
    secret: '58684ee887a900d5de93bb1f21419151',
    js_code: "061yVwth2Rc6cD0YqLqh2DDFth2yVwtB",
    grant_type: 'authorization_code'
}

//  获取用户全局唯一标识openId
const getOpenId = async() => {
    let a = await ownTool.netModel.get(domain, para, {});
    console.log(a);
}

const getAccessToken = async() => {
    const domain = 'https://api.weixin.qq.com/cgi-bin/token';
    let a = await ownTool.netModel.get(domain, {
        grant_type: 'client_credential',
        appid: 'wx8b27b1c81eecd334',
        secret: '58684ee887a900d5de93bb1f21419151'
    });
    let access_token = a.access_token;
    console.log(access_token);
    queryRecord(access_token);
    //console.log(a);
}

const queryRecord = async(token) => {
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token;
    let a = await ownTool.netModel.post(doamin, {
        //access_token: token,
        env: 'test-container-ojiv6',
        query: 'db.collection(\"user\").where({name:"wang"}).get()'
    })
    console.log(a);
}

getAccessToken();

//getOpenId();

//写个接口123 get请求
const apiPrefix = '/api';
app.get(apiPrefix + '/123', async function(req,res){
    let answer = '';
    console.log(req.query, 'sd');
    await Animal.find({'name': '小狗'}, (err, ans) => {
        if (err) {
            console.log("Error:" + err);
        } else {
            console.log("res:" + ans);
            answer = ans;
        }
    });
    res.status(200),
    res.json(answer)
});
 
//配置服务端口
 
let PORT = process.env.PORT || 3000;
var server = app.listen(PORT, function () {
 
    var host = server.address().address;
 
    var port = server.address().port;
    console.log('open success')
 
    console.log('Example app listening at http://%s:%s', host, port);
})