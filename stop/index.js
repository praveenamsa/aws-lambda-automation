const config = require("./config");
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region:'us-east-2'});
var request = require('request');


exports.handler = async (event,  context, callback) => {
    try {
        let instanceStopId = event.instanceId;

        console.log('Instance Stop Lambda triggered');

        let instanceCount = await getInstanceId();
        console.log('Executed getInstanceId Function');

  //      let instanceStopId = instanceCount.data.instanceId;

       await stopInstance(instanceStopId);
       console.log('Executed stopInstance Function')

        await updateStoppedInstanceDetails(instanceStopId);
       console.log('Executed updateStoppedInstanceDetails Function');

        callback(null, 'success')

    } catch (e) {
        console.log(`Exception occurred err: ${e.stack}` );
        callback(e, null)
    }
};

stopInstance = async (instanceStopId) => {
    const params = {
        InstanceIds: [instanceStopId]
    };
    return new Promise((resolve, reject) => {
         ec2.stopInstances(params, function(err, data) {
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

async function updateStoppedInstanceDetails(instanceStopId) {
    try {
        var datetime = new Date().toISOString();
        var requestOptions = {
            uri: config.updateStoppedInstanceDetails,
            method: 'POST',
            json: true,
            body: {
                instanceIdToStop: instanceStopId,
                instanceState: 'Stopped',
                instaceStoppedDate: datetime
            }
        };
        return await apiCallFunction(requestOptions, 'updateStoppedInstanceDetails');
    } catch (exp) {
        console.log('Error in updateStoppedInstanceDetails fn Error:' + exp);
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