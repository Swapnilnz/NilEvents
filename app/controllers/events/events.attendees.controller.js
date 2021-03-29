const eventsModel = require('../../models/events/events.model');
const attendeesModel = require('../../models/events/events.attendees.model');
const usersModel = require('../../models/users/users.model');
const validify = require('../../validation/events/events.validation');

function getFormattedEventAttendees(rows) {
    const numRows = rows.length;
    let allResults = [];
    for (let i = 0; i < numRows; i++) {
        const currRow = rows[i]
        const eventObject = {
            "attendeeId": currRow.user_id,
            "status": currRow.name,
            "firstName": currRow.first_name,
            "lastName": currRow.last_name,
            "dateOfInterest": new Date(currRow.date_of_interest)
        };
        allResults.push(eventObject);

    }
    return allResults;
}

exports.getEventAttendees = async function (req, res) {
    try {
        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];

        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            // Get only accepted
            const rows = await attendeesModel.getAllAcceptedAttendees(eventId, [1]);
            let allResults = getFormattedEventAttendees(rows);
            res.status(200).send(allResults);
        } else {
            const userId = await usersModel.getIdByAuthToken(token);
            if (userId.length === 0) {
                res.status(401).send("Unauthorized");
            } else {
                const currUserId = userId[0].id;
                const eventOrganizerId = eventInfo.organizer_id;
                if (currUserId === eventOrganizerId) {
                    // User is organizer, return everything
                    const rows = await attendeesModel.getAllAcceptedAttendees(eventId, [1, 2, 3]);
                    let allResults = getFormattedEventAttendees(rows);
                    res.status(200).send(allResults);
                } else {
                    // Return only accepted, unless authenticated user is pending or rejected; if so, also return user
                    const attendee = await attendeesModel.getOneAttendee(eventId, currUserId);
                    let attendeeResult = getFormattedEventAttendees(attendee);
                    const allOtherRows = await attendeesModel.getAllAcceptedAttendees(eventId, [1]);
                    let allOtherResults = getFormattedEventAttendees(allOtherRows);
                    let finalResults;
                    if (attendeeResult.length > 0 && attendeeResult[0].status !== 'accepted') {
                        finalResults = allOtherResults.concat(attendeeResult).sort((a, b) => (a.date > b.date) ? 1 : -1);
                    } else {
                        finalResults = allOtherResults;
                    }

                    res.status(200).send(finalResults);
                }
            }

        }

    } catch (err) {
        console.log(err);
        res.status(500).send("ERROR getting all attendees")
    }
};

exports.addEventAttendee = async function (req, res) {
    try {
        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];
        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else {
            const userId = await usersModel.getIdByAuthToken(token);
            if (userId.length === 0) {
                res.status(401).send("Unauthorized");
            } else {
                const currUserId = userId[0].id;
                const eventDate = eventInfo.date;
                const isAttendeeAlready = await attendeesModel.checkUserIsAttendee(eventId, currUserId);
                if ((eventDate < new Date()) || (isAttendeeAlready)) {
                    res.status(403).send('Forbidden');
                } else {
                    await attendeesModel.addEventAttendee(eventId, currUserId);
                    res.status(201).send('Added request, status is now pending');
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.status(500).send("ERROR getting all attendees")
    }

};

exports.removeEventAttendee = async function (req, res) {
    try {
        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];
        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else {
            const userId = await usersModel.getIdByAuthToken(token);
            if (userId.length === 0) {
                res.status(401).send("Unauthorized");
            } else {
                const currUserId = userId[0].id;
                const eventDate = eventInfo.date;
                const acceptanceStatus = await attendeesModel.getAcceptanceStatus(eventId, currUserId);
                if ((eventDate < new Date()) || (acceptanceStatus === null) || (acceptanceStatus === 'rejected')) {
                    res.status(403).send('Forbidden');
                } else {
                    await attendeesModel.deleteEventAttendee(eventId, currUserId);
                    res.status(200).send('Deleted attendee');
                }
            }

        }

    } catch (err) {
        console.log(err);
        res.status(500).send("ERROR removing attendance")
    }

};

exports.updateAttendeeStatus = async function (req, res) {
    const acceptedValues = ["accepted", "pending", "rejected"];
    try {
        const eventId = req.params.event_id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];
        const userId = req.params.user_id;
        const userInfo = (await usersModel.getUserById(userId));

        const isAttendee = await attendeesModel.checkUserIsAttendee(eventId, userId);

        const receivedStatus = req.body.status;

        const headers = req.headers;
        const token = headers['x-authorization'];

        if (typeof eventInfo === 'undefined' || typeof userInfo === 'undefined') {
            res.status(404).send("Event or user id not found!");
        } else if (!isAttendee) {
            res.status(400).send("Bad request (not an attendee)");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else if (typeof receivedStatus !== "string" || !acceptedValues.includes(receivedStatus)) {
            res.status(400).send("Bad request");
        } else {
            const organizerId = await usersModel.getIdByAuthToken(token);
            if (organizerId.length === 0) {
                res.status(401).send("Unauthorized");
            } else if (organizerId[0].id !== eventInfo.organizer_id) {
                res.status(403).send("Forbidden");
            } else {
                await attendeesModel.updateAttendeeStatus(eventId, userId, acceptedValues.indexOf(receivedStatus) + 1);
                res.status(200).send("Updated attendee status");
            }
        }


    } catch (err) {
        console.log(err);
        res.status(500).send("ERROR updating attendee status")
    }
};