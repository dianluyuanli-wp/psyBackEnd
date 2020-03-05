let ownTool = require('xiaohuli-package');
let fs = require('fs');
const request = require('request-promise');
const { getToken, verifyToken, apiPrefix, errorSend } = require('../baseUtil');

function reqisterUserAPI(app) {
    //更新密码
    app.post(apiPrefix + '/updatePassWord', async function(req,res){
        const wxToken = await getToken();
        const { name, oldPass, newPass } = req.body;
        const doamin = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            let updateRes;
            if (await loginVerify(name, oldPass)) {
                updateRes = await ownTool.netModel.post(doamin, {
                    env: 'test-psy-qktuk',
                    query: 'db.collection(\"user\").where({name:"' + name + '"}).' +
                    'update({data: {secret:' + newPass + '}})'
                })
                res.send(updateRes);
            } else {
                res.send({errmsg: 'error'});
            }
        } else {
            errorSend(res);
        }
    });

    //更新用户信息
    app.post(apiPrefix + '/updateUser', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { token, ...rest } = req.body;
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                query: 'db.collection(\"userDetail\").where({name:"' + req.body.name + '"}).' +
                'update({data:' + JSON.stringify(rest) + '})'
            })
            res.send(a);
        } else {
            errorSend(res);
        }
    });

    //  更新用户头像
    app.post(apiPrefix + '/updateAvatar', async function(req,res){
        const wxToken = await getToken();
        const doamin = 'https://api.weixin.qq.com/tcb/uploadfile?access_token=' + wxToken;
        if (verifyToken(req.body)) {
            const { token, name, base64 : originDataUrl, ...rest } = req.body;
            var base64 = originDataUrl.replace(/^data:image\/\w+;base64,/, "");//去掉图片base64码前面部分data:image/png;base64
            var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象，
            const imgName = name + '.png';
            //  把前端传过来的base64转化成本地图片
            fs.writeFile(imgName, dataBuffer,function(err){//用fs写入文件
                if(err){
                    console.log(err);
                }else{
                    //  console.log('写入成功！');
                }
            })
            //  获取图片上传相关信息
            let a = await ownTool.netModel.post(doamin, {
                env: 'test-psy-qktuk',
                path: imgName
            })
            const { authorization, url, token: newToken, cos_file_id, file_id} = a;
            //  真正上传图片
            const option = {
                method: 'POST',
                uri: url,
                formData: {
                    "Signature": authorization,
                    "key": imgName,
                    "x-cos-security-token": newToken,
                    "x-cos-meta-fileid": cos_file_id,
                    "file": {
                        value: fs.createReadStream(imgName),
                        options: {
                            filename: 'test',
                            //contentType: file.type
                        }
                    }
                }
            }
            await request(option);
            //  获取图片的下载链接
            const getDownDomain = 'https://api.weixin.qq.com/tcb/batchdownloadfile?access_token=' + wxToken;
            let imgInfo = await ownTool.netModel.post(getDownDomain, {
                env: 'test-psy-qktuk',
                file_list: [{
                    fileid: file_id,
                    max_age: 7200
                }]
            });
            //  server中转的图片删掉
            fs.unlink(imgName, (e) => {
                if(e) {
                    console.log(e);
                }
            })
            res.send(imgInfo);
        } else {
            errorSend(res);
        }
    });
}

exports.reqisterUserAPI = reqisterUserAPI;