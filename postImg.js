// if(typeof window === 'undefined') {
//     const fetch = require('node-fetch')
// }
//const fetch = require('node-fetch')
const fetch = require('node-fetch');

function formatData(data) {
    const result = Object.entries(data).map(([key, value]) => `${key}=${value}`).join('&');
	return result;
}

function apiRequest(method, url, params, onSuccess, onFail, nodeCookie) {
    const success = function (data) {
        onSuccess(data);
    };

    const apiError = function (error) {
        console.log(error, 'here')
    };
    //const nodeFetch = require('node-fetch');

    const fetchParams = {
        method: method,
        body: params,
        // headers: {
        //     'Content-Type': 'Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        // },
        credentials: 'include'
    };

    //console.log(url, fetchParams, JSON.stringify(params));
    //fetch nodeFetch
    fetch(url, fetchParams).then(function (response) {
        if (response.status < 500) {
            const combine = new Promise(function (resolve) {
                return response.json().then(function (data) {
                    resolve({
                        status: response.status,
                        responseJSON: data
                    });
                });
            });
            return combine;
        }

    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            return response.responseJSON;
        }
        throw error = new Error(response);
    }).then(function (data) {
        success(data);
    }).catch(function (error) {
        apiError(error);
    });
};

exports.Upload = function (path, params) {
    return new Promise(function (resolve, reject) {
        apiRequest('POST', path, params, function (data) {
            resolve(data);
        }, function (errorCode, data) {
            reject({
                errorCode,
                data
            });
        });
    });
}
