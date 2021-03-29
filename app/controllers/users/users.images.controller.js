const imagesModel = require('../../models/users/users.images.model');
const path = require('path');
const fs = require('fs');
const usersModel = require('../../models/users/users.model');

imageRoot = '../../../storage/images/';

exports.getUserImage = async function (req, res) {
    try {
        const userId = req.params.id;
        const userInfo = (await usersModel.getUserById(userId))[0];

        if (typeof userInfo === 'undefined') {
            res.status(404).send("User not found!");
        } else {
            const rows = await imagesModel.getUserImage(userId);
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
        res.status(500).send(`ERROR getting user image: ${err}`);
    }
};

function createFile(contentType, userId, req) {
    let fileName;
    let newFilePath;
    switch (contentType) {
        case 'image/jpeg':
            fileName = `user_${userId}.jpg`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
        case 'image/png':
            fileName = `user_${userId}.png`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
        case 'image/gif':
            fileName = `user_${userId}.gif`;
            newFilePath = `${imageRoot}${fileName}`;
            fs.writeFileSync(path.join(__dirname, newFilePath), req.body);
            break;
    }
    return fileName;
}

exports.setUserImage = async function (req, res) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    try {
        const userId = req.params.id;
        const userInfo = (await usersModel.getUserById(userId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];
        const contentType = headers['content-type'];
        if (typeof userInfo === 'undefined') {
            res.status(404).send("User id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else if (!allowedTypes.includes(contentType) || req.body.length === 0) {

            res.status(400).send("Bad request")
        } else {

            const userIdFromToken = await usersModel.getIdByAuthToken(token);
            if (userIdFromToken.length === 0) {
                res.status(401).send("Unauthorized");
            } else if (userInfo.id !== userIdFromToken[0].id) {
                res.status(403).send("Forbidden");
            } else {
                const rows = await imagesModel.getUserImage(userId);
                if (rows.length > 0 && rows[0].image_filename !== null && rows[0].image_filename.length > 0) { // Delete File
                    const filePath = `${imageRoot}${rows[0].image_filename}`;
                    // Delete file
                    fs.unlinkSync(path.join(__dirname, filePath));
                    let fileName = createFile(contentType, userId, req);
                    await imagesModel.updateFileName(userId, fileName);
                    res.status(200).send("Replaced image");
                } else {
                    // Add new file
                    let fileName = createFile(contentType, userId, req);
                    await imagesModel.updateFileName(userId, fileName);
                    res.status(201).send("Added image");
                }
            }

        }

    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR setting user image: ${err}`);
    }
};

exports.deleteUserImage = async function (req, res) {
    try {
        const userId = req.params.id;
        const userInfo = (await usersModel.getUserById(userId))[0];

        const headers = req.headers;
        const token = headers['x-authorization'];

        if (typeof userInfo === 'undefined') {
            res.status(404).send("User id not found!");
        } else if (typeof token === 'undefined' || token === "null") {
            res.status(401).send("Unauthorized");
        } else {

            const userIdFromToken = await usersModel.getIdByAuthToken(token);
            if (userIdFromToken.length === 0) {
                res.status(401).send("Unauthorized");
            } else if (userInfo.id !== userIdFromToken[0].id) {
                res.status(403).send("Forbidden");
            } else {
                const rows = await imagesModel.getUserImage(userId);
                if (rows.length > 0 && rows[0].image_filename !== null && rows[0].image_filename.length > 0) {
                    // Delete
                    const filePath = `${imageRoot}${rows[0].image_filename}`;
                    await imagesModel.deleteImage(userId);
                    fs.unlinkSync(path.join(__dirname, filePath));
                    res.status(200).send("Image deleted");
                } else {
                    res.status(404).send("Image not found");
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(`ERROR deleting user image: ${err}`);
    }
};