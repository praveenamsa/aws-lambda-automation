const config = require("./config");
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region:'us-east-2'});
var request = require('request');


exports.handler = async (event,  context, callback) => {
    try {
        let instanceIdterminate = event.instanceId;

        console.log('Lambda triggered');

        // let instanceCount = await getInstanceId();
        // console.log('Executed getInstanceId Function');

//        let instanceIdterminate = instanceCount.data.instanceId;

       await terminateInstance(instanceIdterminate);
       console.log('Executed terminateInstance Function')

        await updateInstanceDetails(instanceIdterminate);
        console.log('Executed updateInstanceDetails Function');

        callback(null, 'success')

    } catch (e) {
        console.log(`Exception occurred err: ${e.stack}` );
        callback(e, null)
    }
};

terminateInstance = async (instaceIdTerminate) => {
    const params = {
        InstanceIds: [instaceIdTerminate]
    };
    return new Promise((resolve, reject) => {
         ec2.terminateInstances(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log(data);
                resolve(data);// successful response
            }
        });
    })
};

async function getInstanceId( ) {
    try {
        var requestOptions = {
            uri: config.getCount,
            method: 'GET',
            json: true,
            };
        return await apiCallFunction(requestOptions, 'getInstanceCount');
    } catch (exp) {
        console.log('Error in getInstanceCount fn Error:' + exp);
    }
}

async function updateInstanceDetails(instanceIdterminate) {
    try {
        var datetime = new Date().toISOString();
        var requestOptions = {
            uri: config.updateInstanceDetails,
            method: 'POST',
            json: true,
            body: {
                instanceIdToTerminate: instanceIdterminate,
                instanceState: 'Terminated',
                instanceTerminatedDate: datetime
            }
        };
        return await apiCallFunction(requestOptions, 'updateInstanceCount');
    } catch (exp) {
        console.log('Error in updateInstanceCount fn Error:' + exp);
    }
}

apiCallFunction = (requestOptions, callFrom) => {

    return new Promise((resolve, reject) => {
        request(requestOptions, function (httpError, httpResponse, body) {
            console.log(httpError);
            console.log(`${callFrom} res body : ${JSON.stringify(body)} `);

            if (httpError) {
                console.log(`Error in apiCallFunction fn from ${callFrom} :  ${httpError} `);
                throw httpError;
            } else if (httpResponse.body.msgCode === 'MSG_SUCCESS' || httpResponse.body.msgCode ==='MSG_PIECESUCCESS') {
                resolve(body);
            } else {
                console.log(`Error in apiCallFunction fn from ${callFrom} Error:  ${httpError} `);
                throw httpError
            }
        })
    })

}
// this.handler('', null, (err, res) => {
//
// })

