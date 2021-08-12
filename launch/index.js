const config = require("./config");
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region:'us-east-2'});
var request = require('request');

exports.handler = async (event,  context, callback) => {
    try {
        let instancePurpose = event.purpose;
        // let imageId;
        // // if(instancePurpose == "seraching")
        // // {
        // //     imageId = " ";
        // // }
        // // else if(instancePurpose == "removal")
        // // {
        // //     imageId = " ";
        // // }
        // // else
        // // {
        // //     imageId = " ";
        // // }
       // let regionOfInstance = event.regionOfInstance;
        let instanceCount, instanceData, startInstanceData;
        console.log('Lambda triggered');

        instanceCount = await getInstanceCount();
        console.log('Executed getInstanceCount Function');
       // instanceData.Instances[0].InstanceId
        startInstanceData = await runNewInstance(instanceCount.data.count);
        console.log('Executed runNewInstance Function');

        instanceData = await getInstanceState(startInstanceData.InstanceId, startInstanceData.State.Name);
        console.log('Executed getInstanceState Function');

        await updateInstanceCount(instanceData, instanceCount.data.count, instancePurpose);
        console.log('Executed updateInstanceCount Function');

        callback(null, 'success')

    } catch (e) {
        console.log(`Exception occurred err: ${e.stack}` );
        callback(e, null)
    }
};
getInstanceState = async (instanceId, instanceState) => {
    let instanceData;
    const params = {
        InstanceIds: [instanceId]
    };
    while (instanceState != "running") {
        let tempData = await subGetInstanceState(params);
        instanceState = tempData.Reservations[0].Instances[0].State.Name;
        instanceData = tempData.Reservations[0].Instances[0];
        console.log(tempData);
    }
    return instanceData;
}

subGetInstanceState = (params) => {
    return new Promise((resolve, reject) => {
        ec2.describeInstances(params, function(err, data) {
            if (err) {
                console.log("Error", err.stack);
                throw err;
            } else {
                resolve(data);
                console.log("Success", JSON.stringify(data));
            }
        });
    })
}
// cloud_final_modules:
//     - [scripts-user, always]
//#cloud-config
runNewInstance = async (count) => {
    console.log('Instance Count : '+count);
    let command1 = `#cloud-config
    password: ubuntu
    chpasswd: { expire: False }
    ssh_pwauth: True
    hostname: ubuntu-worker-${count+1}
    manage_etc_hosts: true
    shell: /bin/sh
    runcmd:
     - sh /home/ubuntu/file1.sh`;

    const params = {
        ImageId: 'ami-06fce45c714372cf9',
        InstanceType: 't3.large',
        KeyName: 'consumer_dev',
        MinCount: 1,
        MaxCount: 1,
        SecurityGroups: [
            'ubuntu-worker1-SG'
        ],
        TagSpecifications: [
            {
                ResourceType: "instance",
                Tags: [
                    {
                        Key: "Name",
                        Value: `ubuntu-worker-${count+1}`
                    }
                ]
            }
        ],
        UserData: new Buffer(command1).toString('base64')
    };

    return new Promise((resolve, reject) => {
         ec2.runInstances(params, function(err, data) {
            if (err) {
                console.log('Error occurred while lunching an Instance', err.stack); // an error occurred
                throw  err;
            } else {
                console.log('Instance Started Successfully'+ JSON.stringify(data));
                resolve(data.Instances[0]);
                // console.log('New Instance Launched and count is : '+count);
            }
        });
    })

};

async function getInstanceCount( ) {
    try {
        var requestOptions = {
            uri: config.getCount,
            method: 'GET',
            json: true,
        };
        return await apiCallFunction(requestOptions, 'getInstanceCount');
    } catch (exp) {
        console.log('Error in getInstanceCount fn Error:', exp.stack);
        throw exp
    }
}

async function updateInstanceCount(instanceData, instanceCount, instancePurpose) {
    try {
        var requestOptions = {
            uri: config.updateCount,
            method: 'POST',
            json: true,
            body: {
                instanceData: instanceData,
                instanceCount: instanceCount,
                purpose: instancePurpose
            }
        }
        return await apiCallFunction(requestOptions, 'updateInstanceCount');
    } catch (exp) {
        console.log('Error in updateInstanceCount fn Error:' + exp.stack);
        throw exp;
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
