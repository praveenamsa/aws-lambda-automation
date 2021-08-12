const config = require("./config");
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region:'us-east-2'});
var request = require('request');


exports.handler = async (event,  context, callback) => {
    try {
        let instanceStartId = event.instanceId;
        console.log('Start Instance Lambda triggered');

        let instanceCount = await getInstanceId();
        console.log('Executed getInstanceId Function');

  //      let instanceStartId = instanceCount.data.instanceId;

        let instanceStateTemp = await getInstanceState(instanceStartId);
        let instanceState = instanceStateTemp.Reservations[0].Instances[0].State.Name;

        if(instanceState == "stopping") {

            console.log(`Instance ${instanceStartId} 's state still in Stopping, Please try again once Stopped`);
            callback(null, 'Instance State still in Stopping, Please try again Later')
        }
        else {
            await startInstance(instanceStartId);
            console.log('Executed start Instance Function')

            console.log('Triggered updateStartedInstanceDetails Function');
            await updateStartedInstanceDetails(instanceStartId);
            console.log('Executed updateStartedInstanceDetails Function');

            callback(null, 'success')
        }


    } catch (e) {
        console.log(`Exception occurred err: ${e.stack}` );
        callback(e, null)
    }
};

startInstance = async (instanceStartId) => {
    const params = {
        InstanceIds: [instanceStartId]
    };
    return new Promise((resolve, reject) => {
         ec2.startInstances(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log(data);
                resolve(data);// successful response
            }
        });
    })
};
    

getInstanceState = (instanceId) => {
    const params = {
        InstanceIds: [instanceId]
    };
    return new Promise((resolve, reject) => {
        ec2.describeInstances(params, function(err, data) {
            if (err) {
                console.log("Error", err.stack);
                throw err;
            } else {
                resolve(data);
         //       console.log("Success", JSON.stringify(data));
            }
        });
    })
}

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

async function updateStartedInstanceDetails(instanceId) {
    try {
        var requestOptions = {
            uri: config.updateStartedInstanceDetails,
            method: 'POST',
            json: true,
            body: {
                instanceIdToStart: instanceId,
                instanceState: 'running'
            }
        };
        return await apiCallFunction(requestOptions, 'updateStartedInstanceDetails');
    } catch (exp) {
        console.log('Error in updateStartedInstanceDetails fn Error:' + exp);
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