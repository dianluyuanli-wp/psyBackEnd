let ownTool = require('xiaohuli-package');
const { getToken, verifyToken, apiPrefix, errorSend } = require('../baseUtil');

function reqisterInterviewerAPI(app) {
    //  查询某个咨询师的可用预约列表
    app.post(apiPrefix + '/getInterviewerList', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databasequery?access_token=' + wxToken;
        if (verifyToken(req.body)) {
    
            const result = await ownTool.netModel.post(doamin, {
                //access_token: token,
                env: 'test-psy-qktuk',
                query: 'db.collection(\"interviewee\").where({counselorId:"' + req.body.name + '"}).orderBy("formData.date","desc").get()'
            })
            res.send(result);
        } else {
            errorSend(res);
        }
    });
    //  更改预约时段状态
    app.post(apiPrefix + '/updateStatus', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { token, name, ...rest } = req.body;
            let a = await ownTool.netModel.post(doamin, 
                {
                    env: 'test-psy-qktuk',
                    query: 'db.collection(\"interviewee\").doc("' +req.body._id + '").update({data:{status: "' + req.body.status + '"}})'
                }
            )
            res.send(a);
        } else {
            errorSend(res);
        }
    });
}

exports.reqisterInterviewerAPI = reqisterInterviewerAPI;