let ownTool = require('xiaohuli-package');
let fs = require('fs');
const request = require('request-promise');
const fse = require('fs-extra');
const path = require('path');
const multiparty = require('multiparty');
const os = require('os');
const { getToken, verifyToken, apiPrefix, errorSend, loginVerify } = require('../baseUtil');
const { updateApi, uploadApi, downLoadApi } = require('./apiDomain');

const UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录

const regWin = /window/i;
const parsePath = (route) => regWin.test(os.type()) ? route.replace(/\\/, '/') : route;

const pipeStream = (path, writableStream) => 
    new Promise(resolve => {
        const readStream = fse.createReadStream(parsePath(path));
        readStream.on('end', () => {
            fse.unlinkSync(path);
            resolve()
        });
        readStream.pipe(writableStream);
    })

const mergeFileChunk = async (filePath, fileName, size) => {
    const chunkDir = path.resolve(UPLOAD_DIR, fileName);
    const chunkPaths = await fse.readdir(chunkDir);
    chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
    await Promise.all(chunkPaths.map((chunkPath, index) =>
        pipeStream(path.resolve(chunkDir, chunkPath),
            fse.createWriteStream(parsePath(filePath), { start: index * size, end: (index + 1) * size })
            //  fse.createWriteStream(filePath)
        )
    ));
    fse.removeSync(chunkDir);
}

function reqisterUserAPI(app) {
    //更新密码
    app.post(apiPrefix + '/updatePassWord', async function(req,res){
        const wxToken = await getToken();
        const { name, oldPass, newPass } = req.body;
        const doamin = updateApi + wxToken;
        if (verifyToken(req.body)) {
            let updateRes;
            if ((await loginVerify(name, oldPass)).verifyResult) {
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
        const doamin = updateApi + wxToken;
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
        const doamin = uploadApi + wxToken;
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
            const getDownDomain = downLoadApi + wxToken;
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

    //  上传文件
    app.post(apiPrefix + '/uploadFile', async function(req, res) {
        const multipart = new multiparty.Form();
        multipart.parse(req, async (err, fields, files) => {
            if (err) {
                return;
            }
            const [chunk] = files.chunk;
            const [hash] = fields.hash;
            const [filename] = fields.filename
            const chunkDir = path.resolve(UPLOAD_DIR, filename);

            if (!fse.existsSync(chunkDir)) {
                await fse.mkdirs(chunkDir);
            }

            await fse.move(chunk.path, `${chunkDir}/${hash}`);
            res.end('received file chunk');
        })
    })

    //  合并文件
    app.post(apiPrefix + '/fileMergeReq', async function(req, res) {
        if (verifyToken(req.body)) {
            const { fileName, size } = req.body;
            const filePath = path.resolve(UPLOAD_DIR, `${fileName}`);
            await mergeFileChunk(filePath, fileName, size);
            res.send('merge success');
        } else {
            errorSend(res);
        }
    })
}

exports.reqisterUserAPI = reqisterUserAPI;