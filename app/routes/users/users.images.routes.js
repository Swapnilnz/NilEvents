const usersImagesController = require('../../controllers/users/users.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id/image')
        .get(usersImagesController.getUserImage)
        .put(usersImagesController.setUserImage)
        .delete(usersImagesController.deleteUserImage);
};
