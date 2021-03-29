const eventsModel = require('../../models/events/events.model');
const usersModel = require('../../models/users/users.model');
const validify = require('../../validation/events/events.validation');



exports.getEventCategories = async function (req, res) {

    try {
        const categories = await eventsModel.getAllCategories();
        categories.sort((a, b) => (a.id > b.id) ? 1 : -1); // Sort by id asc
        res.status(200).send(categories);
    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR getting all event categories: ${err}`);
    }
};

exports.getOneEvent = async function (req, res) {
    try {
        const eventId = req.params.id;

        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];
        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else {
            const categoryInfo = await eventsModel.getEventCategories(eventId);
            var categories = [];
            categoryInfo.forEach(function (item) {
                categories.push(item.category_id);
            });
            const attendeesInfo = await eventsModel.getEventNumAttendeesByState(eventId, "accepted");
            const eventObject = {
                "eventId": eventId,
                "title": eventInfo.title,
                "categories": categories,
                "organizerFirstName": eventInfo.first_name,
                "organizerLastName": eventInfo.last_name,
                "numAcceptedAttendees": attendeesInfo[0].num_attendees,
                "capacity": eventInfo.capacity,
                "description": eventInfo.description,
                "organizerId": eventInfo.organizer_id,
                "date": eventInfo.date,
                "isOnline": !!(eventInfo.is_online),
                "url": eventInfo.url,
                "venue": eventInfo.venue,
                "requiresAttendanceControl": !!(eventInfo.requires_attendance_control),
                "fee": parseInt(eventInfo.fee)
            };
            res.status(200).send(eventObject);
        }

    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR getting event: ${err}`);

    }
};

async function filterResults(query, categoryIds, organizerId) {
    let ids_category = [];
    let category_result = await eventsModel.getAllByCategories(categoryIds);
    if (categoryIds.length > 0 && category_result.length === 0) {
        return [];
    }
    category_result.forEach(function (item) {
            ids_category.push(item.event_id);
        }
    );

    let ids_query_organizer = [];
    let query_organizer_result = await eventsModel.getAllByQueryAndOrganizer(query, organizerId);
    if (query_organizer_result.length === 0) {
        return [];
    }
    query_organizer_result.forEach(function (item) { ids_query_organizer.push(item.id); });
    if (ids_query_organizer.length > 0 && ids_category.length > 0) {
        return ids_query_organizer.filter(value => ids_category.includes(value));
    }
    if (ids_category.length > 0) {
        return ids_category;
    }
    if (ids_query_organizer.length > 0) {
        return ids_query_organizer;
    }

    return [];
}

async function sortResults(allResults, sortBy) {
    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            allResults.sort((a, b) => (a.title > b.title) ? 1 : -1);
            break;
        case "ALPHABETICAL_DESC":
            allResults.sort((a, b) => (a.title < b.title) ? 1 : -1);
            break;
        case "ATTENDEES_ASC":
            allResults.sort((a, b) => (a.numAcceptedAttendees > b.numAcceptedAttendees) ? 1 : -1);
            break;
        case "ATTENDEES_DESC":
            allResults.sort((a, b) => (a.numAcceptedAttendees < b.numAcceptedAttendees) ? 1 : -1);
            break;
        case "DATE_ASC":
            allResults.sort((a, b) => (a.date > b.date) ? 1 : -1);
            break;
        case "DATE_DESC":
            allResults.sort((a, b) => (a.date < b.date) ? 1 : -1);
            break;
        case "CAPACITY_ASC":
            allResults.sort((a, b) => (a.capacity > b.capacity) ? 1 : -1);
            break;
        case "CAPACITY_DESC":
            allResults.sort((a, b) => (a.capacity < b.capacity) ? 1 : -1);
            break;
        default:
            allResults.sort((a, b) => (a.date < b.date) ? 1 : -1);
            break;
    }
}

exports.getAllEvents = async function(req, res) {
    var sortByValues = ["ALPHABETICAL_ASC", "ALPHABETICAL_DESC", "ATTENDEES_ASC", "ATTENDEES_DESC",
        "DATE_ASC", "DATE_DESC", "CAPACITY_ASC", "CAPACITY_DESC"];
    try {

        if (await validify.validifyGetAllEvents(req, res)) {
            const startIndex = (typeof req.query.startIndex === 'undefined') ? 0 : parseInt(req.query.startIndex);
            let count = (typeof req.query.count === 'undefined') ? null : parseInt(req.query.count); // defaults to size of all results
            const query = (typeof req.query.q === 'undefined') ? "%" : req.query.q;
            const categoryIds = (typeof req.query.categoryIds === 'undefined') ? [] : req.query.categoryIds;
            const organizerId = (typeof req.query.organizerId === 'undefined') ? null : req.query.organizerId;
            const sortBy = ((typeof req.query.sortBy === 'undefined') || (!sortByValues.includes(req.query.sortBy))) ? "DATE_DESC" : req.query.sortBy;

            let finalResults = [];
            const filteredEventIds = await filterResults(query, categoryIds, organizerId);
            const numIds = filteredEventIds.length;
            let allResults = [];
            for (let i = 0; i < numIds; i++) {
                const eventInfo = await eventsModel.getEventAndOrganizerById(filteredEventIds[i]);
                const categoryInfo = await eventsModel.getEventCategories(filteredEventIds[i]);
                let categories = [];
                categoryInfo.forEach(function (item) {categories.push(item.category_id);});
                const attendeesInfo = await eventsModel.getEventNumAttendeesByState(filteredEventIds[i], "accepted");
                const eventObject = {
                    "date": eventInfo[0].date, // deleted eventually
                    "eventId": eventInfo[0].id,
                    "title": eventInfo[0].title,
                    "categories": categories,
                    "organizerFirstName": eventInfo[0].first_name,
                    "organizerLastName": eventInfo[0].last_name,
                    "numAcceptedAttendees": attendeesInfo[0].num_attendees,
                    "capacity": eventInfo[0].capacity
                };
                allResults.push(eventObject);

            }
            if (allResults.length > 0) {
                await sortResults(allResults, sortBy);
                allResults.forEach(function (item) {delete item.date});
                if (count === null) {count = allResults.length}

                let j = startIndex;
                const end = startIndex + count
                while ((j < end) && (j < allResults.length)) {
                    finalResults.push(allResults[j]);
                    j++;
                }

                res.status(200).send(finalResults);
            } else {
                res.status(400).send("No events of that category are present")
            }


        }
    } catch(err) {
        console.log(err);
        res.status(500).send(`ERROR getting all events by query: ${err}`);
    }
};

exports.addEvent = async function(req, res) {

    if (await validify.validifyNewEvent(req, res)) {
        try {
            const headers = req.headers;
            const token = headers['x-authorization'];
            if (typeof token === 'undefined' || token === "null") {
                res.status(401).send(`Unauthorized!`);
            } else {
                const userId = await usersModel.getIdByAuthToken(token);
                if (userId.length === 0) {
                    res.status(401).send("Unauthorized");
                } else {
                    const organizerId = userId[0].id;
                    const title = req.body.title;
                    const description = req.body.description;
                    const categoryIds = req.body.categoryIds;
                    const date = req.body.date;
                    const isOnline = (typeof req.body.isOnline === 'undefined') ? 0 : req.body.isOnline;
                    const url = (typeof req.body.url === "undefined") ? null : req.body.url;
                    const venue = (typeof req.body.venue === 'undefined') ? null : req.body.venue;
                    const capacity = (typeof req.body.capacity === 'undefined') ? null : req.body.capacity;
                    const reqAC = (typeof req.body.requiresAttendanceControl === 'undefined') ? 0 : req.body.requiresAttendanceControl;
                    const fee = (typeof req.body.fee === 'undefined') ? 0.00 : req.body.fee;
                    const values = [title, description, date, isOnline, url, venue, capacity, reqAC, fee, organizerId];
                    try {
                        const eventId = (await eventsModel.addEvent(values))[1][0].id;
                        await eventsModel.addEventAndCategories(eventId, categoryIds);
                        res.status(201).send({eventId: eventId});
                    } catch (err) {
                        if (err.errno === 1062) { // Duplicate
                            res.status(400).send("Event already exists!");
                        } else {
                            res.status(500).send(err);
                        }
                    }
                }
            }

        } catch(err) {
            console.log(err);
            res.status(500).send(`ERROR Adding event: ${err}`);
        }
    }
};

exports.deleteEvent = async function(req, res) {
    try {
        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];

        if (typeof token === 'undefined' || token === "null") {
            res.status(401).send(`Unauthorized!`);
        } else if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else {
            const userId = await usersModel.getIdByAuthToken(token);
            if (userId.length === 0) {
                res.status(401).send("Unauthorized");
            } else {
                const organizerId = eventInfo.organizer_id;
                const currUserId = (await usersModel.getIdByAuthToken(token))[0].id;

                if (organizerId !== currUserId) {
                    res.status(403).send("Forbidden");
                } else {
                    await eventsModel.deleteEventCategoriesForEvent(eventId);
                    await eventsModel.deleteEventAttendeesForEvent(eventId);
                    await eventsModel.deleteEvent(eventId);
                    res.status(200).send("Event deleted");
                }
            }
        }
    }  catch (err) {
        console.log(err);
        res.status(500).send(`ERROR deleting event: ${err}`);
    }
};

exports.updateEvent = async function(req, res) {
    if (await validify.validifyUpdateEvent(req, res)) {
        try {
            const eventId = req.params.id;
            const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

            const headers = req.headers;
            const token = headers['x-authorization'];

            if (typeof token === 'undefined' || token === "null") {
                res.status(401).send(`Unauthorized!`);
            } else if (typeof eventInfo === 'undefined') {
                res.status(404).send("Event id not found!");
            } else if (new Date() >= new Date(eventInfo.date)) {
                res.status(400).send("You can no longer update this event as it has already occurred!");
            } else {
                const userId = await usersModel.getIdByAuthToken(token);
                if (userId.length === 0) {
                    res.status(401).send("Unauthorized");
                } else {
                    const organizerId = eventInfo.organizer_id;
                    const currUserId = userId[0].id;
                    if (organizerId !== currUserId) {
                        res.status(403).send("Forbidden");
                    } else {
                        const title = (typeof req.body.title === 'undefined') ? false : req.body.title;
                        const description = (typeof req.body.description === 'undefined') ? false : req.body.description;
                        const categoryIds = (typeof req.body.categoryIds === 'undefined') ? false : req.body.categoryIds;
                        const date = (typeof req.body.date === 'undefined') ? false : req.body.date;
                        const isOnline = (typeof req.body.isOnline === 'undefined') ? false : req.body.isOnline;
                        const url = (typeof req.body.url === 'undefined') ? false : req.body.url;
                        const venue = (typeof req.body.venue === 'undefined') ? false : req.body.venue;
                        const capacity = (typeof req.body.capacity === 'undefined') ? false : req.body.capacity;
                        const reqAC = (typeof req.body.reqAC === 'undefined') ? false : req.body.reqAC;
                        const fee = (typeof req.body.reqAC === 'undefined') ? false : req.body.fee;

                        if (title !== false) {
                            await eventsModel.updateColumnById("title", title, eventId);
                        }
                        if (description !== false) {
                            await eventsModel.updateColumnById("description", description, eventId);
                        }
                        if (date !== false) {
                            await eventsModel.updateColumnById("date", date, eventId);
                        }
                        if (isOnline !== false) {
                            await eventsModel.updateColumnById("is_online", isOnline, eventId);
                        }
                        if (url !== false) {
                            await eventsModel.updateColumnById("url", url, eventId);
                        }
                        if (venue !== false) {
                            await eventsModel.updateColumnById("venue", venue, eventId);
                        }
                        if (capacity !== false) {
                            await eventsModel.updateColumnById("capacity", capacity, eventId);
                        }
                        if (reqAC !== false) {
                            await eventsModel.updateColumnById("requires_attendance_control", reqAC, eventId);
                        }
                        if (fee !== false) {
                            await eventsModel.updateColumnById("fee", fee, eventId);
                        }
                        if (categoryIds !== false) {
                            await eventsModel.deleteEventCategoriesForEvent(eventId);
                            await eventsModel.addEventAndCategories(eventId, categoryIds);
                        }

                        res.status(200).send("Event updated");
                    }
                }
            }
        }  catch (err) {
            console.log(err);
            res.status(500).send(`ERROR updating event: ${err}`);
        }
    }

};