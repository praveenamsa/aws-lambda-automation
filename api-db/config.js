const config = {
    port: 3004,
    dbConfig: {
        database: {
            host     : 'ubuntuworkerdb.cfconb1qupnm.us-east-2.rds.amazonaws.com',
            user     : 'admin',
            password : 'root1234',
            database : "ubuntudb",
            port     : 3306
        },
        pooling: {
            "connectionLimit": 1000,
            "waitForConnections": true,
            "acquireTimeout": 20000
        }
    }
}

module.exports = config