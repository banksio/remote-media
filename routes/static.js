const path = require('path');
const appRoot = require('app-root-path');

module.exports = function (app) {

    // Serve the receiver
    app.get('/', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/views/index.html'));
    });

    // Serve the admin panel
    app.get('/admin', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/views/admin.html'));
    });

    // Serve css
    app.get('/stylesheets/fa.css', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/@fortawesome/fontawesome-free/css/all.css'));
    });

    // Serve socket.io
    app.get('/js/socket.io.js', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/socket.io-client/dist/socket.io.js'));
    });

    // Serve socket.io
    app.get('/js/socket.io.js.map', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/socket.io-client/dist/socket.io.js.map'));
    });

    // Serve bootstrap and popper js
    app.get('/js/bootstrap.bundle.min.js', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
    });

    // Serve bootstrap and popper js
    app.get('/js/bootstrap.bundle.min.js.map', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map'));
    });

    // Serve jQuery
    app.get('/js/jquery.slim.min.js', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/jquery/dist/jquery.slim.min.js'));
    });

    // Serve jQuery
    app.get('/js/jquery.slim.min.js.map', function (req, res) {
        res.sendFile(path.join(appRoot.toString(), '/node_modules/jquery/dist/jquery.slim.min.js.map'));
    });
}