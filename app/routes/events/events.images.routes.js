const eventsImagesController = require('../../controllers/events/events.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/image')
        .get(eventsImagesController.getEventImage)
        .put(eventsImagesController.setEventImage);
};
