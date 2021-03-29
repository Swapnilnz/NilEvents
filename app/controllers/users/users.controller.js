const usersModel = require('../../models/users/users.model');
const validify = require('../../validation/users/users.validation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.registerUser = async function(req, res) {
    if (await validify.validifyNewUser(req, res)) {
        try {
            const email = req.body.email;
            const password = req.body.password;
            const exists = await usersModel.checkEmailExists(email);
            if (!exists) {
                const saltRounds = 10;

                const hash = await bcrypt.hash(password, saltRounds);
                await usersModel.insertUser(req, hash);

                const userId = await usersModel.getUserIdByEmail(email);

                const idObj = {
                    "userId" : userId[0][0].id
                }
                res.status(201).send(idObj);
            } else {
                res.status(400).send("Email already exists!");
            }
        } catch(err) {
            console.log(err)
            res.status(500).send(`ERROR registering user: ${err}`);
        }
    }
};

exports.loginUser = async function(req, res) {
  if (await validify.validifyLoginInput(req, res)) {
      try {
          const email = req.body.email;
          const password = req.body.password;
          const exists = await usersModel.checkEmailExists(email);
          if (exists) {
              const passwordHash = await usersModel.getPasswordHashByEmail(email)

              const validCredentials = await bcrypt.compare(password, passwordHash[0].password);

              if (validCredentials) {
                  const userId = (await usersModel.getUserIdByEmail(email))[0][0].id;

                  let inUse = true;
                  let token = null;

                  while (inUse) {
                      token = jwt.sign(
                          { userId: userId},
                          "91415037",
                          { expiresIn: '24h' });
                      inUse = await usersModel.checkTokenInUse(token);
                  }

                  await usersModel.addAuthTokenToUser(token, userId);

                  res.status(200).json({
                      userId: userId,
                      token: token
                  });


              } else {
                  res.status(400).send("Bad request: email or password incorrect!")
              }
          } else {
              res.status(400).send("Bad request: email or password incorrect!")
          }

      } catch(err) {
          console.log(err)
          res.status(500).send(`ERROR logging in user: ${err}`);
      }
  }
};

exports.logoutUser = async function(req, res) {
    try {
        const headers = req.headers;
        const token = headers['x-authorization'];
        if (token !== "null" && token.length > 0) {
            const inUse = await usersModel.checkTokenInUse(token);

            if (inUse) {
                await usersModel.removeAuthTokenFromUser(token);
                res.status(200).send("User has been logged out");
            } else {
                res.status(401).send("Unauthorized");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(`ERROR logging out user: ${err}`);
    }

};

exports.getOneUser = async function (req, res) {
    try {
        const headers = req.headers;
        const token = headers['x-authorization'];
        const id = req.params.id;
        const results = await usersModel.getUserById(id);
        if (results.length < 1) {
            res.status(404).send(`User with id '${id}' not found!`);
        } else {
            const userJson = results[0];
            if (userJson.auth_token === token) {
                res.status(200).send({
                    "firstName": userJson.first_name,
                    "lastName": userJson.last_name,
                    "email": userJson.email
                });
            } else {
                res.status(200).send({
                    "firstName": userJson.first_name,
                    "lastName": userJson.last_name,
                });
            }

        }

    } catch (err) {
        console.log(err)
        res.status(500).send(`ERROR getting user: ${err}`);

    }
};

exports.updateUser = async function (req, res) {
  try {
      const headers = req.headers;
      const token = headers['x-authorization'];
      const id = req.params.id;
      const results = await usersModel.getUserById(id);
      let authToken = null;
      if (results.length > 0) {
          authToken = results[0].auth_token;
      }
      if (typeof token === "undefined" || token === "null") {
          res.status(401).send(`Unauthorized!`);
      } else if (results.length < 1) {
          res.status(404).send(`User with id '${id}' not found!`);
      } else if (token !== authToken) {
          res.status(403).send(`Forbidden`);
      } else {
          if (await validify.checkValidPatch(req, res)) {
              const userJson = results[0];
              const email = (typeof req.body.email === 'undefined') ? false : req.body.email;
              let existsAlready = false;
              if (email) {
                  existsAlready = await usersModel.checkEmailExists(email);
              }
              if (!existsAlready) {
                  let validPassword = true;
                  const currentPassword = req.body.currentPassword;
                  const firstName = req.body.firstName;
                  const lastName = req.body.lastName;
                  const email = req.body.email;
                  if (typeof currentPassword !== 'undefined') {

                      validPassword = await bcrypt.compare(currentPassword, userJson.password);
                      if (validPassword) {
                          const password = req.body.password;
                          const hash = await bcrypt.hash(password, 10);
                          await usersModel.updatePasswordById(hash, userJson.id);
                      } else {
                          res.status(400).send("Current password is incorrect!");
                          return;
                      }
                  }
                  if (typeof firstName !== 'undefined') {
                      await usersModel.updateFirstNameById(firstName, userJson.id);
                  }
                  if (typeof lastName !== 'undefined') {
                      await usersModel.updateLastNameById(lastName, userJson.id);
                  }
                  if (typeof email !== 'undefined') {
                      await usersModel.updateEmailById(email, userJson.id);
                  }
                  res.status(200).send();
              } else {
                  res.status(400).send("Email already exists!");
              }
          }
      }

  } catch (err) {
      console.log(err)
      res.status(500).send(`ERROR updating user: ${err}`);
  }
};