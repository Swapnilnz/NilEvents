const db = require('../../../config/db');

exports.getUserImage = async function (userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT image_filename FROM user WHERE id = ?';
        const [rows] = await conn.query(sql, userId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.updateFileName = async function (userId, fileName) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user SET image_filename = ? WHERE id = ?';
        await conn.query(sql, [fileName, userId]);
        conn.release();
    } catch (err) {
        throw (err);
    }
};

exports.deleteImage = async function (userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE user SET image_filename = NULL WHERE id = ?';
        await conn.query(sql, userId);
        conn.release();
    } catch (err) {
        throw (err);
    }
};

