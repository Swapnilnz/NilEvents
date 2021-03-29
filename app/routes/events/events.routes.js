const eventsController = require('../../controllers/events/events.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/categories')
        .get(eventsController.getEventCategories);

    app.route(app.rootUrl + '/events/:id')
        .get(eventsController.getOneEvent)
        .patch(eventsController.updateEvent)
        .delete(eventsController.deleteEvent);


    app.route(app.rootUrl + '/events')
        .get(eventsController.getAllEvents)
        .post(eventsController.addEvent);


};
