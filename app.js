var express=require('express');
var app =express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let ownTool = require('xiaohuli-package');
const { getToken, verifyToken, secret, apiPrefix, errorSend } = require('./baseUtil');
const { reqisterPeriodAPI } = require('./Api/period');
const { reqisterUserAPI } = require('./Api/user');
const { reqisterInterviewerAPI } = require('./Api/interviewer');

var jwt = require('jwt-simple');

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

reqisterPeriodAPI(app);
reqisterUserAPI(app);
reqisterInterviewerAPI(app);

//写个接口123 get请求
app.post(apiPrefix + '/query', async function(req,res){
    const token = await getToken();
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token;
    let a = await ownTool.netModel.post(doamin, {
        env: 'test-psy-qktuk',
        query: req.body.query
    })
    res.status(200),
    res.json(a);
});

const loginVerify = async function(userName, password) {
    const token = await getToken();
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token;
    const request =  await ownTool.netModel.post(doamin, {
        env: 'test-psy-qktuk',
        query: 'db.collection(\"user\").where({name:"' + userName + '"}).get()'
    })
    return request.errmsg === 'ok' && JSON.parse(request.data).secret.toString() === password
}

//登陆接口 
app.post(apiPrefix + '/login', async function(req,res){
    const { password, userName, type } = req.body;
    if (await loginVerify(userName, password)) {
        res.send({
            status: 'ok',
            type,
            currentAuthority: 'user',
            //  用户请求的鉴权token
            accessToken: jwt.encode(Object.assign(req.body, { tokenTimeStamp: Date.now() } ), secret)
        });
    } else {
        res.send({
            status: 'error',
            type,
            currentAuthority: 'guest',
            accessToken: ''
        });
    }
});

//拉取用户信息接口 
app.post(apiPrefix + '/currentUser', async function(req,res){
    const wxToken = await getToken();
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + wxToken;
    if (verifyToken(req.body)) {
        let a = await ownTool.netModel.post(doamin, {
            env: 'test-psy-qktuk',
            query: 'db.collection(\"userDetail\").where({name:"' + req.body.name + '"}).get()'
        })
        res.send(a);
    } else {
        errorSend(res);
    }
});
 
//配置服务端口

let PORT = process.env.PORT || 4000;
var server = app.listen(PORT, function () {
 
    var host = server.address().address;
 
    var port = server.address().port;
    console.log('open success')
 
    console.log('Example app listening at http://%s:%s', host, port);
})