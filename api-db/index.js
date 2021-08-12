const config = require("./config");
const mysql = require('mysql');
const serverless = require('serverless-http');
var http = require("http");
var https = require("https");
const moment = require("moment");

const express = require("express");
var bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(cors());

// http.createServer(app).listen(config.port, function () {
//     console.log("info", 'DTS app listening on port ' + config.port + '!');
// });

 // serverless option to run in lambda function
module.exports.handler = serverless(app);

var connection = mysql.createConnection(config.dbConfig.database);
console.log('DB connection triggered');
connection.connect();


app.get("/api/getInstanceCount", getInstanceCountFn);
app.post("/api/updateInstanceCount", updateInstanceCount);
app.post("/api/updateInstanceDetails", updateInstanceDetails);
app.post("/api/updateStoppedInstanceDetails", updateStoppedInstanceDetails);
app.post("/api/updateStartedInstanceDetails", updateStartedInstanceDetails);

async function getInstanceCountFn(req, res) {
    var resJson = {msgCode:"MSG_SYSTEMERR"}
    try{
        console.log(req.url);
        console.log(` Inside getInstanceCountFn Api: ${req.body}`);
        var sql = "SELECT COUNT(*) AS totalCount FROM instance_count";
        let instanceCount = await executeQuery(sql, '');

        let countOfInstance = instanceCount[0].totalCount;

        // var instanceIdSql = "SELECT instanceId AS getInstanceId FROM instance_count where s_no = '" + countOfInstance + "'";
        // let instanceIds = await executeQuery(instanceIdSql, '');
        resJson = {
            msgCode: "MSG_SUCCESS",
            data:{count:instanceCount[0].totalCount}
            // data:{count:instanceCount[0].totalCount, instanceId:instanceIds[0].getInstanceId}
        }
        return res.status(200).send(resJson);
    }
    catch(e){
        console.log(`Exception occurred err: ${e.stack}` );
        return res.status(500).send(resJson);
    }
}
async function updateInstanceCount (req, res) {
    var resJson = {msgCode:"MSG_SYSTEMERR"}
    try{
        console.log(req.url);
        console.log(` Inside updateInstanceCount Api: ${req.body}`);
        let params = req.body;
        let instanceName = `Ubuntu-Worker-${params.instanceCount+1}`
        let launchedDate = `${params.instanceData.LaunchTime}`
        var launched = moment(launchedDate).format('YYYY-MM-DD HH:mm:ss');
        var sql = ` INSERT INTO instance_count (instanceId, s_no) VALUES ("${params.instanceData.InstanceId}", ${params.instanceCount + 1}) `;
        await executeQuery(sql, '');
        var instanceQuery = ` INSERT INTO workers (name, instanceId, ipAddress, purpose, launchedDate, currentStatus)
        VALUES ("${instanceName}","${params.instanceData.InstanceId}", "${params.instanceData.PublicIpAddress}", "${params.purpose}", "${launched}",
        "${params.instanceData.State.Name}")`;
        await executeQuery(instanceQuery, '');
        console.log("Instance details Inserted");
        resJson = {
            msgCode: "MSG_SUCCESS",
        }
        return res.status(200).send(resJson);
    }
    catch(e){
        console.log(`Exception occurred err: ${e.stack}` );
        return res.status(500).send(resJson);
    }
}

async function updateInstanceDetails (req, res) {
    var resJson = {msgCode:"MSG_SYSTEMERR"}
    try{
        console.log(req.url);
        console.log(` Inside updateInstanceDetails Api: ${req.body}`);
        let parms = req.body;
        let instanceId = `${parms.instanceIdToTerminate}`
        let instanceState =`${parms.instanceState}`
        let terminatedDate = `${parms.instanceTerminatedDate}`
        var terminated = moment(terminatedDate).format('YYYY-MM-DD HH:mm:ss');
        let sqlUpdateDetails = `UPDATE workers SET currentStatus = "${instanceState}", terminatedDate = "${terminated}" WHERE instanceId = "${instanceId}" `;
        await executeQuery(sqlUpdateDetails, '');
        console.log("Instance Details Updated");

        let sqlDeleteCount = `DELETE FROM instance_count  WHERE instanceId = "${instanceId}" `;
        await executeQuery(sqlDeleteCount, '');
        console.log("Instance Count Removed");

        resJson = {
            msgCode: "MSG_SUCCESS",
        }
        return res.status(200).send(resJson);
    }
    catch(e){
        console.log(`Exception occurred err: ${e.stack}` );
        return res.status(500).send(resJson);
    }
}

async function updateStoppedInstanceDetails (req, res) {
    var resJson = {msgCode:"MSG_SYSTEMERR"}
    try{
        console.log(req.url);
        console.log(` Inside updateStoppedInstanceDetails Api: ${req.body}`);
        let parms = req.body;
        let instanceId = `${parms.instanceIdToStop}`
        let instanceState =`${parms.instanceState}`
        let instancestoppedDate = `${parms.instaceStoppedDate}`
        var stopped = moment(instancestoppedDate).format('YYYY-MM-DD HH:mm:ss');
        let sqlUpdateDetails = `UPDATE workers SET currentStatus = "${instanceState}", stoppedDate = "${stopped}"
         WHERE instanceId = "${instanceId}" `;

        await executeQuery(sqlUpdateDetails, '');
        console.log("Stopped Instance Details Updated");

        resJson = {
            msgCode: "MSG_SUCCESS",
        }
        return res.status(200).send(resJson);
    }
    catch(e){
        console.log(`Exception occurred err: ${e.stack}` );
        return res.status(500).send(resJson);
    }
}

async function updateStartedInstanceDetails (req, res) {
    var resJson = {msgCode:"MSG_SYSTEMERR"}
    try{
        console.log(req.url);
        console.log(` Inside updateStartedInstanceDetails Api: ${req.body}`);
        let parms = req.body;
        let instanceIdToStart = `${parms.instanceIdToStart}`
        let instanceState1 =`${parms.instanceState}`
        let sql2 = `UPDATE workers SET currentStatus = "${instanceState1}" WHERE instanceId = "${instanceIdToStart}" `;
        await executeQuery(sql2, '');
        console.log("Started Instance Details are Updated");

        resJson = {
            msgCode: "MSG_SUCCESS",
        }
        return res.status(200).send(resJson);
    }
    catch(e){
        console.log(`Exception occurred err: ${e.stack}` );
        return res.status(500).send(resJson);
    }
}

const executeQuery = (sql, callFrom) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, res) => {
            // connection.destroy();
            if(err) throw err;
            resolve(res);
        });
    })
}