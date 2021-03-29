const eventsModel = require('../../models/events/events.model');
const imagesModel = require('../../models/events/events.images.model');
const path = require('path');
const fs = require('fs');
const usersModel = require('../../models/users/users.model');

imageRoot = '../../../storage/images/';

exports.getEventImage = async function (req, res) {
    try {
        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else {
            const rows = await imagesModel.getEventImage(eventId);
            if (rows.length > 0 && rows[0].image_filename !== null && rows[0].image_filename.length > 0) {
                const filePath = `${imageRoot}${rows[0].image_filename}`;
                if (fs.existsSync(path.join(__dirname, filePath))) {
                    res.status(200).sendFile(path.join(__dirname, filePath));
                } else {
                    res.status(404).send("File not found");
                }
            } else {
                res.status(404).send("File not found");
            }

        }

    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR getting event image: ${err}`);
    }
};

function createFile(contentType, eventId, req) {
    let fileName;
    let newFilePath;
    switch (contentType) {
        case 'image/jpeg':
            fileName = `event_${eventId}.jpg`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
        case 'image/png':
            fileName = `event_${eventId}.png`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
        case 'image/gif':
            fileName = `event_${eventId}.gif`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
    }
    return fileName;
}

exports.setEventImage = async function (req, res) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    try {
        console.log(req.headers['content-type']);

        const eventId = req.params.id;
        const eventInfo = (await eventsModel.getOneEventById(eventId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];
        const contentType = headers['content-type'];
        if (typeof eventInfo === 'undefined') {
            res.status(404).send("Event id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else if (!allowedTypes.includes(contentType) || req.body.length === 0) {
            res.status(400).send("Bad request")
        } else {
            const userId = await usersModel.getIdByAuthToken(token);
            if (userId.length === 0) {
                res.status(401).send("Unauthorized");
            } else if (eventInfo.organizer_id !== userId[0].id) {
                res.status(403).send("Forbidden");
            } else {
                const rows = await imagesModel.getEventImage(eventId);
                if (rows.length > 0 && rows[0].image_filename !== null && rows[0].image_filename.length > 0) { // Delete File
                    const filePath = `${imageRoot}${rows[0].image_filename}`;
                    // Delete file
                    fs.unlink(path.join(__dirname, filePath), (err) => {
                        console.log(err);
                    });
                    let fileName = createFile(contentType, eventId, req);
                    await imagesModel.updateFileName(eventId, fileName);
                    res.status(200).send("Replaced image");
                } else {
                    // Add new file
                    let fileName = createFile(contentType, eventId, req);
                    await imagesModel.updateFileName(eventId, fileName);
                    res.status(201).send("Added image");
                }
            }

        }
    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR setting event image: ${err}`);
    }
};