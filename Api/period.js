let ownTool = require('xiaohuli-package');
const { getToken, verifyToken, apiPrefix, errorSend } = require('../baseUtil');

function reqisterPeriodAPI(app) {
    //  添加一个预约时段
    app.post(apiPrefix + '/addPeriod', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databaseadd?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { token, name, ...rest } = req.body;
            let a = await ownTool.netModel.post(doamin, 
                {
                    env: 'test-psy-qktuk',
                    query: 'db.collection(\"period\").add({ data: ' + JSON.stringify(rest) +'})'
                }
            )
            res.send(a);
        } else {
            errorSend(res);
        }
    });
    //  拉取当前用户的时段
    app.post(apiPrefix + '/queryPeriod', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { offset, size } = req.body;
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"period\").where({counselorId:"' + req.body.counselorId + '"}).' +
                'skip(' + offset +').limit(' + size + ').orderBy("date","desc").get()'
            })
            res.send(a);
        } else {
            errorSend(res);
        }
    });

    //更新用户的时段的状态
    app.post(apiPrefix + '/updatePeriod', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { name, token, _id, ...reset } = req.body;
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"period\").where({_id:"' + _id + '"}).' +
                'update({data:' + JSON.stringify(reset) + '})'
            })
            res.send(a);
        } else {
            errorSend(res);
        }
    });
}

exports.reqisterPeriodAPI = reqisterPeriodAPI;