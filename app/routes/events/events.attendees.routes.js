const eventsAttendeesController = require('../../controllers/events/events.attendees.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/attendees')
        .get(eventsAttendeesController.getEventAttendees)
        .post(eventsAttendeesController.addEventAttendee)
        .delete(eventsAttendeesController.removeEventAttendee);

    app.route(app.rootUrl + '/events/:event_id/attendees/:user_id')
        .patch(eventsAttendeesController.updateAttendeeStatus);


};
