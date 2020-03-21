let ownTool = require('xiaohuli-package');
let fs = require('fs');
const request = require('request-promise');
const fse = require('fs-extra');
const path = require('path');
const multiparty = require('multiparty');
//  const os = require('os');
const { getToken, verifyToken, apiPrefix, errorSend, loginVerify } = require('../baseUtil');
const { updateApi, uploadApi, downLoadApi } = require('./apiDomain');

const UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录

// const regWin = /window/i;
// const parsePath = (route) => regWin.test(os.type()) ? route.replace(/\\/g, '/') : route;

const pipeStream = (path, writableStream) => 
    new Promise(resolve => {
        const readStream = fse.createReadStream(path);
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
            fse.createWriteStream(filePath, { start: index * size, end: (index + 1) * size })
        )
    ));
    try {
        //  反复改名啥的很奇怪，但是不这样就会有报错，导致请求返回pending，可能是windows下的bug
        //  文件夹的名字和文件名字不能重复
        await fse.move(filePath, path.resolve(UPLOAD_DIR, `p${fileName}`));
        fse.removeSync(chunkDir);
        await fse.move(path.resolve(UPLOAD_DIR, `p${fileName}`), path.resolve(UPLOAD_DIR, `${fileName}`));
    } catch(e) {
        //  不管怎么操作这里都会有神秘报错，errno: -4048 目测是权限或者缓存问题
        //  console.log(e);
        await fse.move(path.resolve(UPLOAD_DIR, `p${fileName}`), path.resolve(UPLOAD_DIR, `${fileName}`));
    }
}

async function uploadToCloud(filePath, fileName) {
    const wxToken = await getToken();
    const fullPath = path.resolve(filePath, fileName);
    const doamin = uploadApi + wxToken;
    //  获取图片上传相关信息
    let a = await ownTool.netModel.post(doamin, {
        env: 'test-psy-qktuk',
        path: fileName
    })
    const { authorization, url, token: newToken, cos_file_id, file_id} = a;
    //  真正上传图片
    const option = {
        method: 'POST',
        uri: url,
        formData: {
            "Signature": authorization,
            "key": fileName,
            "x-cos-security-token": newToken,
            "x-cos-meta-fileid": cos_file_id,
            "file": {
                value: fs.createReadStream(fullPath),
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
    fs.unlink(fullPath, (e) => {
        if(e) {
            console.log(e);
        }
    })
    return imgInfo;
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
            const imgInfo = await uploadToCloud(path.resolve(__dirname, '..'), imgName);
            res.send(imgInfo);
        } else {
            errorSend(res);
        }
    });

    //  接收上传的文件片段
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
            const filePath = path.resolve(UPLOAD_DIR, `${fileName}`, `${fileName}`);
            await mergeFileChunk(filePath, fileName, size);
            const fileInfo = await uploadToCloud(UPLOAD_DIR, `${fileName}`);
            res.send(fileInfo);
        } else {
            errorSend(res);
        }
    })
}

exports.reqisterUserAPI = reqisterUserAPI;