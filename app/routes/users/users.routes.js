const userController = require('../../controllers/users/users.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(userController.registerUser);

    app.route(app.rootUrl + '/users/login')
        .post(userController.loginUser);

    app.route(app.rootUrl + '/users/logout')
        .post(userController.logoutUser);

    app.route(app.rootUrl + '/users/:id')
        .get(userController.getOneUser)
        .patch(userController.updateUser);
};
