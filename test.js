var AWS = require('aws-sdk');
const fs = require('fs');

const invokeLambda = (lambda, params) => new Promise((resolve, reject) => {
    lambda.invoke(params, (error, data) => {
        if (error) {
            reject(error);
        } else {
            resolve(data);
        }
    });
});

const main = async () => {
    
    let region = process.env.AWS_REGION;
    let functionURN = process.env.AWS_FUNCTION_URN;
    
    // You shouldn't hard-code your keys in production!
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: region,
    });

    const lambda = new AWS.Lambda();

    let keywords = ['weather berlin', 'news germany', 'what else', 'some keyword'];
    let promises = [];

    for (let kw of keywords) {
        let event = { keyword: kw };
        let params = {
            FunctionName: functionURN,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(event),
        };
        console.log(params);
        promises.push(
            invokeLambda(lambda, params)
        )
    }

    console.log(`Invoked ${promises.length} lambda requests!`);

    var start = new Date();
    let results = await Promise.all(promises);
    var end = new Date() - start;

    console.log(`invokeLambda() in region ${region} took ${end/1000} seconds`);

    for (let result of results) {
        let data = result.Payload;
        data = JSON.parse(data);
        console.dir(data, {depth: null, colors: true});
        console.log(`invokeLambda() in region ${region} took ${end / 1000} seconds`);
    }
};

main().catch(error => console.error(error));
