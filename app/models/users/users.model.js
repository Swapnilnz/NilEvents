const db = require('../../../config/db');

exports.getUserById = async function (id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT * FROM user WHERE user.id = ?';
        const [result] = await conn.query(sql, id);
        conn.release();
        return result;

    } catch (err) {
        
        throw err;
    }
};

exports.getUserIdByEmail = async function (email) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT id FROM user WHERE user.email = ?';
        const result = await conn.query(sql, email);
        conn.release();
        return result;

    } catch (err) {
        
        throw err;
    }
};

exports.getPasswordHashByEmail = async function (email) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT password FROM user WHERE email = ?';
        const [result] = await conn.query(sql, email);
        conn.release();
        return result;
    } catch (err) {
        
        throw err;
    }
};

exports.getIdByAuthToken = async function (authToken) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT id FROM user WHERE auth_token = ?';
        const [result] = await conn.query(sql, authToken);
        conn.release();
        return result;
    } catch (err) {
        
        throw err;
    }
}

exports.addAuthTokenToUser = async function (token, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set auth_token = ? WHERE id = ?';
        await conn.query(sql, [token, userId]);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};

exports.insertUser = async function (req, hashedPassword) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'INSERT INTO user (email, first_name, last_name, password) VALUES (?, ? ,?, ?)';
        const values = [email, firstName, lastName, hashedPassword];
        await conn.query(sql, values);
        conn.release();
    } catch (err) {
        
        throw err;
    }

};

exports.checkEmailExists = async function (email) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT count(*) AS emailExists FROM user WHERE user.email = ?';
        const [result] = await conn.query(sql, email);
        conn.release();
        return result[0].emailExists !== 0;

    } catch (err) {
        
        throw err;
    }
};

exports.checkLoginCredentials = async function (email, password) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT count(*) AS userValid FROM user WHERE email = ? AND password = ?';
        const values = [email, password];
        const result = await conn.query(sql, values);
        conn.release();
        return result[0].userValid !== 0;
    } catch (err) {
        
        throw err;
    }
};

exports.checkTokenInUse = async function (token) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT count(*) AS inUse FROM user WHERE auth_token IS NOT NULL AND auth_token = ? ';
        const [result] = await conn.query(sql, token);
        conn.release();
        return result[0].inUse !== 0;
    } catch (err) {
        
        throw err;
    }
};

exports.removeAuthTokenFromUser = async function (token) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set auth_token = null WHERE auth_token = ?';
        await conn.query(sql, token);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};

exports.updatePasswordById = async function (password, id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set password = ? WHERE id = ?';
        await conn.query(sql, [password, id]);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};

exports.updateFirstNameById = async function (firstName, id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set first_name = ? WHERE id = ?';
        await conn.query(sql, [firstName, id]);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};

exports.updateLastNameById = async function (lastName, id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set last_name = ? WHERE id = ?';
        await conn.query(sql, [lastName, id]);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};

exports.updateEmailById = async function (email, id) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user Set email = ? WHERE id = ?';
        await conn.query(sql, [email, id]);
        conn.release();
    } catch (err) {
        
        throw err;
    }
};