const db = require('../../../config/db');

exports.getEventImage = async function (eventId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT image_filename FROM event WHERE id = ?';
        const [rows] = await conn.query(sql, eventId);
        conn.release();
        return rows;
    } catch (err) {
        throw (err);
    }
};

exports.updateFileName = async function (eventId, fileName) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE event SET image_filename = ? WHERE id = ?';
        await conn.query(sql, [fileName, eventId]);
        conn.release();
    } catch (err) {
        throw (err);
    }
};