function checkString(string, description) {
    if (description === "email") {
        return ((typeof string === "string") && (string.length > 0) && (string.includes('@')));
    }

    else {
        return (typeof string === "string" && string.length > 0);
    }
}

exports.validifyNewUser = async function (req, res) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    const isValidFirstName = checkString(firstName, "firstName");
    if (!isValidFirstName) {
        res.status(400).send("Invalid first name: minLength 1, String");
        return false;
    }

    const isValidLastName = checkString(lastName, "lastName");
    if (!isValidLastName) {
        res.status(400).send("Invalid last name: minLength 1, String");
        return false;
    }

    const isValidPassword = checkString(password, "password");
    if (!isValidPassword) {
        res.status(400).send("Invalid password: minLength 1, String");
        return false;
    }

    const isValidEmail = checkString(email, "email");
    if (!isValidEmail) {
        res.status(400).send("Invalid email: minLength 1, String, contains '@'");
        return false;
    }

    return true;
};

exports.validifyLoginInput = async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const isValidPassword = checkString(password, "password");
    if (!isValidPassword) {
        res.status(400).send("Invalid password: minLength 1, String");
        return false;
    }

    const isValidEmail = checkString(email, "email");
    if (!isValidEmail) {
        res.status(400).send("Invalid email: minLength 1, String, contains '@'");
        return false;
    }
    return true;
}

exports.checkValidPatch = async function(req, res) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const currentPassword = req.body.currentPassword;

    if ((typeof firstName !== "undefined") && ((typeof firstName !== "string") || (firstName.length < 1))) {
        res.status(400).send("Invalid first name: minLength 1, String");
        return false;
    }

    if ((typeof lastName !== "undefined") && ((typeof lastName !== "string") || (lastName.length < 1))) {
        res.status(400).send("Invalid last name: minLength 1, String");
        return false;
    }

    if ((typeof email !== "undefined") && ((typeof email !== "string") || !(email.includes('@')))) {
        res.status(400).send("Invalid email: minLength 1, String, contains '@'");
        return false;
    }

    if ((typeof password === "undefined") && (typeof currentPassword === "undefined")) {return true};

    if ((typeof password !== "undefined") && (typeof currentPassword !== "undefined")) {
        if (password.length < 1 || currentPassword.length < 1) {
            res.status(400).send("Invalid password(s): minLength 1, String");
            return false;
        }
        return true;
    } else {
        res.status(400).send("You must provide both current and new password, or neither!");
        return false;
    }
};