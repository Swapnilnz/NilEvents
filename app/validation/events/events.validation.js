const eventsModel = require('../../models/events/events.model');

function checkValidInts(shouldBeInts, isValid) {
    shouldBeInts.forEach(function (int, index) {
        if (typeof shouldBeInts[index] !== 'undefined') {
            shouldBeInts[index] = parseInt(int);
            if ((!Number.isInteger(shouldBeInts[index])) || (!(shouldBeInts[index] >= 0))) {
                isValid = false;
            }
        }
    });
    return isValid;
}

async function checkValidCategories(categoryIds) {

    if (typeof categoryIds !== 'undefined') {
        if (categoryIds.length > 1) {
            for (let i = 0; i < categoryIds.length; i++) {
                const isValidCatagory = await eventsModel.checkCategoryExists(categoryIds[i]);
                if (!isValidCatagory) {
                    return false;
                }
            }
        } else {
            categoryIds = parseInt(categoryIds);
            if (Number.isInteger(categoryIds)) {
                const isValidCatagory = await eventsModel.checkCategoryExists(categoryIds);
                if (!isValidCatagory) {

                    return false;
                }
            } else {

                return false;
            }
        }
    } else {
        return true;
    }
    return true;
}

exports.validifyGetAllEvents = async function (req, res) {
    const startIndex = req.query.startIndex;
    const count = req.query.count;
    let categoryIds = req.query.categoryIds;
    const organizerId = req.query.organizerId;

    let shouldBeInts = [startIndex, count, organizerId];

    let isValid = true;
    isValid = checkValidInts(shouldBeInts, isValid);

    if (!isValid) {
        res.status(400).send("Bad request: Make sure your startIndex, count, and organizerId queries are integers >= 0!");
        return false;
    }

    let isCategoryValid = await checkValidCategories(categoryIds);

    if (!isCategoryValid) {
        res.status(400).send("Bad request: Make sure your categoryId queries are integers and are valid ids!");
        return false;
    }

    return true;

};


function validifyEventHelper(res, isOnline, url, venue, capacity, reqAC, fee) {

    if (typeof isOnline !== 'undefined' && isOnline !== null && typeof isOnline !== "boolean") {
        res.status(400).send("Please provide either true or false for isOnline");
        return false;
    }

    if (typeof url !== 'undefined' && url !== null && typeof url !== "string") {
        res.status(400).send("Please provide a string for the url");
        return false;
    }

    if (typeof venue !== 'undefined' && venue !== null && typeof venue !== "string") {
        res.status(400).send("Please provide a string for the venue");
        return false;
    }

    if (typeof capacity !== 'undefined' && capacity !== null && typeof capacity !== "number") {
        res.status(400).send("Please provide a integer for the venue");
        return false;
    }

    if (typeof reqAC !== 'undefined' && reqAC !== null && typeof reqAC !== "boolean") {
        res.status(400).send("Please provide either true or false for requiresAttendanceControl");
        return false;
    }

    if (typeof fee !== 'undefined' && fee !== null && typeof fee !== "number") {
        res.status(400).send("Please provide a integer for the fee");
        return false;
    }

    return true;
}

exports.validifyNewEvent = async function (req, res) {
    const title = req.body.title;
    const description = req.body.description;
    const categoryIds = req.body.categoryIds;
    // Optional
    const date = req.body.date;
    const isOnline = req.body.isOnline;
    const url = req.body.url;
    const venue = req.body.venue;
    const capacity = req.body.capacity;
    const reqAC = req.body.requiresAttendanceControl;
    const fee = req.body.fee;

    if ((typeof title === 'undefined') || (typeof title !== "string") || (title.length < 1)) {
        res.status(400).send("Please provide a title");
        return false;
    }

    if ((typeof description === 'undefined') || (typeof description !== "string")) {
        res.status(400).send("Please provide a description");
        return false;
    }

    if ((typeof categoryIds !== 'number' && typeof categoryIds !== 'object') || (categoryIds === null)) {
        res.status(400).send("Please provide categoryIds as a list or number");
        return false;
    } else {
        let categoriesValid = await checkValidCategories(categoryIds);
        if (!categoriesValid) {
            res.status(400).send("Bad request: Make sure your categoryIds are integers and are valid ids!");
            return false;
        }
    }

    if (typeof date !== 'undefined') {
        try {
            const currDate = new Date();
            const newDate = new Date(date.replace(/-/g, "/"));
            if ((isNaN(newDate.getTime())) || (currDate >= newDate)) {
                res.status(400).send("Please provide a date that's in the future");
                return false;
            }
        } catch (err) {
            console.log(err);
            res.status(400).send(err);
            return false;
        }
    }

    return validifyEventHelper(res, isOnline, url, venue, capacity, reqAC, fee);
};

exports.validifyUpdateEvent = async function (req, res) {
    const title = req.body.title;
    const description = req.body.description;
    const categoryIds = req.body.categoryIds;
    const date = req.body.date;
    const isOnline = req.body.isOnline;
    const url = req.body.url;
    const venue = req.body.venue;
    const capacity = req.body.capacity;
    const reqAC = req.body.requiresAttendanceControl;
    const fee = req.body.fee;

    if ((title === null) || (typeof title !== 'undefined' && typeof title !== "string") || (title.length < 1)) {
        res.status(400).send("Please provide a string for the title");
        return false;
    }

    if ((description === null) || (typeof description !== 'undefined' && typeof description !== "string") || (description.length < 1)) {
        res.status(400).send("Please provide a string for the description");
        return false;
    }

    if (typeof categoryIds === 'undefined') {
    } else if ((typeof categoryIds !== 'number' && typeof categoryIds !== 'object') || (categoryIds === null)) {
        res.status(400).send("Please provide categoryIds as a list or number");
        return false;
    } else {
        let categoriesValid = await checkValidCategories(categoryIds);
        if (!categoriesValid) {
            res.status(400).send("Bad request: Make sure your categoryIds are integers and are valid ids!");
            return false;
        }
    }


    if (typeof date !== 'undefined') {
        try {
            const currDate = new Date();
            const newDate = new Date(date.replace(/-/g, "/"));
            if ((isNaN(newDate.getTime())) || (currDate >= newDate)) {
                res.status(400).send("Please provide a date that's in the future");
                return false;
            }
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
            return false;
        }
    }

    return validifyEventHelper(res, isOnline, url, venue, capacity, reqAC, fee);

};