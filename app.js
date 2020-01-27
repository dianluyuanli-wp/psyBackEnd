var express=require('express');
var app =express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let mongoose = require('mongoose');
let ownTool = require('xiaohuli-package');
let { Animal, BookInfo } = require('./modle');

var jwt = require('jwt-simple');
const secret = 'xiaohuli';

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

let accessObj = {
    token: '',
    period: 0,
    getTimeStamp: 0
};

// mongoose.connect('mongodb://@127.0.0.1:27017/psy',
// { useNewUrlParser: true });

// let db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   // we're connected!
//   console.log('success!');
// });

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
    return await ownTool.netModel.get(domain, {
        grant_type: 'client_credential',
        appid: 'wxac77677dc117cc7f',
        secret: '4d06c4b654f7145675960e6c9a5a29a2'
    });
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

//写个接口获取token get请求
const apiPrefix = '/api';
app.get(apiPrefix + '/getToken', async function(req,res){
    let ans = '';
    let { token, period, getTimeStamp} = accessObj;
    const nowTiemStamp = Date.now();
    if (token && (nowTiemStamp < (getTimeStamp + period * 1000))) {
        ans = token;
    } else {
        const { access_token, expires_in } = await getAccessToken();
        accessObj.token = access_token;
        accessObj.getTimeStamp = nowTiemStamp;
        accessObj.period = expires_in;
        ans = access_token;
    }
    res.status(200),
    res.json(ans)
});

const getToken = async () => {
    let { token, period, getTimeStamp} = accessObj;
    const nowTiemStamp = Date.now();
    if (token && (nowTiemStamp < (getTimeStamp + period * 1000))) {
        return token;
    } else {
        const { access_token, expires_in } = await getAccessToken();
        accessObj.token = access_token;
        accessObj.getTimeStamp = nowTiemStamp;
        accessObj.period = expires_in;
        return access_token;
    } 
}

//getOpenId();

//写个接口123 get请求
app.post(apiPrefix + '/query', async function(req,res){
    let answer = '';
    const token = await getToken();
    console.log(req.body, 'body');
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token;
    let a = await ownTool.netModel.post(doamin, {
        //access_token: token,
        env: 'test-psy-qktuk',
        query: req.body.query
    })
    res.status(200),
    res.json(a);
});

//登陆接口 
app.post(apiPrefix + '/login', async function(req,res){
    let answer = '';
    const { password, userName, type } = req.body;
    const token = await getToken();
    console.log(req.body, 'body');
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token;
    let a = await ownTool.netModel.post(doamin, {
        //access_token: token,
        env: 'test-psy-qktuk',
        query: 'db.collection(\"user\").where({name:"' + userName + '"}).get()'
    })
    if (a.errmsg === 'ok' && JSON.parse(a.data).secret === password) {
        res.send({
            status: 'ok',
            type,
            currentAuthority: 'user',
            //  用户请求的鉴权token
            accessToken: jwt.encode(Object.assign({ tokenTimeStamp: Date.now() }, req.body), secret)
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
const aa = {
    name: 'wang',
    avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: '00000001',
    email: 'antdesign@alipay.com',
    signature: '海纳百川，有容乃大',
    title: '交互专家',
    group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
    tags: [
      {
        key: '0',
        label: '很有想法的',
      },
      {
        key: '1',
        label: '专注设计',
      },
      {
        key: '2',
        label: '辣~',
      },
      {
        key: '3',
        label: '大长腿',
      },
      {
        key: '4',
        label: '川妹子',
      },
      {
        key: '5',
        label: '海纳百川',
      },
    ],
    notifyCount: 12,
    unreadCount: 11,
    country: 'China',
    geographic: {
      province: {
        label: '浙江省',
        key: '330000',
      },
      city: {
        label: '杭州市',
        key: '330100',
      },
    },
    address: '西湖区工专路 77 号',
    phone: '0752-268888888',
};

const errorSend = (res) => {
    res.send({
        response: {
            status: '401',
            url: '报错'
        },
    });
}

//拉取用户信息接口 
app.post(apiPrefix + '/currentUser', async function(req,res){
    let answer = '';
    const { name, token = '' } = req.body;
    const wxToken = await getToken();
    console.log(req.body, 'body');
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + wxToken;
    if (verifyToken(req.body)) {
        // let a = await ownTool.netModel.post(doamin, {
        //     //access_token: token,
        //     env: 'test-psy-qktuk',
        //     query: 'db.collection(\"user\").where({name:"' + userName + '"}).get()'
        // })
        res.send(aa);
    } else {
        errorSend(res);
    }
});

const outOfDatePeriod = 2 * 60 * 60 * 1000;

const verifyToken = ({name, token = ''}) => {
    const res =  token ? jwt.decode(token, secret) : {};
    console.log(res, name);
    return res.userName === name && (res.tokenTimeStamp + outOfDatePeriod) > Date.now();
}

app.post(apiPrefix + '/getInterviewerList', async function(req,res){
    const wxToken = await getToken();
    const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + wxToken;
    if (verifyToken(req.body)) {
        const result = await ownTool.netModel.post(doamin, {
            //access_token: token,
            env: 'test-psy-qktuk',
            query: 'db.collection(\"interviewee\").where({"userInfo.nickName":"' + '日出君' + '"}).get()'
        })
        res.send(result);
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