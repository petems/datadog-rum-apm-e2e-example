// Will append "-ui" to the RUM service to help differentiate the browser APM spans
let myService = process.env.DD_SERVICE ? (process.env.DD_SERVICE+"-ui") : "datablog-ui";

var rum = {
    clientToken: process.env.DD_CLIENT_TOKEN,
    applicationId: process.env.DD_APPLICATION_ID,
    env: process.env.DD_ENV  || "development",
    service: myService,
    version: process.env.DD_VERSION || "2.0.0"
}

module.exports = rum;