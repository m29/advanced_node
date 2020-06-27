const AWS = require('aws-sdk');
const keys = require('../config/keys');
const { v4: uuidv4 } = require('uuid');
const requireLogin = require('../middlewares/requireLogin');

const s3 = new AWS.S3({
    accessKeyId: keys.accessKeyId,
    secretAccessKey: keys.secretAccessKey,
    signatureVersion: 'v4',
    region: 'ap-south-1'
});

module.exports = app => {

    app.post('/api/upload', requireLogin, (req, res) => {

        const key = `${req.user.id}/${uuidv4()}.${req.body.type.replace("image/", "")}`;

        s3.getSignedUrl('putObject', {
            Bucket: 'manik-advnode',
            ContentType: req.body.type,
            Key: key
        }, (err, url) => {
            res.send({ key, url });
        });
    });
};