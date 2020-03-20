let ownTool = require('xiaohuli-package');
const { getToken, verifyToken, apiPrefix, errorSend } = require('../baseUtil');
const { updateApi, queryApi, sendApi } = require('./apiDomain');

const dbId = '61795c245e742b3b0007311c20a92a42';

function registerPageManagerAPI(app) {
    //更新用户的时段的状态
    app.post(apiPrefix + '/uploadPageInfo', async function(req,res){
        const wxToken = await getToken();
        const doamin = updateApi + wxToken;
        if (verifyToken(req.body)) {
            const { name, token, _id, ...reset } = req.body;
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"pageInfo\").where({_id:"' + dbId + '"}).' +
                'update({data:' + JSON.stringify(reset) + '})'
            })
            res.send(a);
        } else {
            errorSend(res);
        }
    });

    //  拉取页面信息
    app.post(apiPrefix + '/getPageInfo', async function(req,res){
        const wxToken = await getToken();
        const doamin = queryApi + wxToken;
        if (verifyToken(req.body)) {
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"pageInfo\").where({_id:"' + dbId + '"}).get()'
            })
            res.send(a);
        } else {
            errorSend(res);
        }
    });
}

exports.registerPageManagerAPI = registerPageManagerAPI;