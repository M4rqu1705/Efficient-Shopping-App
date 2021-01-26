// https://scotch.io/courses/build-your-first-nodejs-website/using-express-and-nodemon
// https://expressjs.com/en/starter/static-files.html
// https://codeforgeek.com/render-html-file-expressjs/
// https://timonweb.com/javascript/running-expressjs-server-over-https/


// IMPORTS
let express = require('express');
let fs = require('fs');
let https = require('https');
let path = require('path');

// SETUP
let app = express();
var PORT = 80;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
});

let server = https.createServer({
    key: fs.readFileSync('./certificates/server.key'),
    cert: fs.readFileSync('./certificates/server.cert')
}, app);

server.listen(PORT, function () {
    console.log(`App startet on port ${PORT}`);
});
