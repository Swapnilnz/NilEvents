const db = require('../../../config/db');

exports.checkUserIsAttendee = async function (eventId, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT count(*) as isAttendee FROM event_attendees WHERE event_id = ? and user_id = ?';
        const [rows] = await conn.query(sql, [eventId, userId]);
        conn.release();
        return rows[0].isAttendee !== 0;
    } catch (err) {
        throw (err);
    }
};

exports.getAcceptanceStatus = async function (eventId, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'SELECT name FROM event_attendees join attendance_status `as` on event_attendees.attendance_status_id = `as`.id where event_id = ? and user_id = ?';
        const [rows] = await conn.query(sql, [eventId, userId]);
        conn.release();
        if (rows.length > 0) {
            return rows[0].name;
        } else {
            return null;
        }
    } catch (err) {
        throw (err);
    }
};

exports.getAllAcceptedAttendees = async function (eventId, status) {
    let statusString = JSON.stringify(status);
    statusString = statusString.replace("[", "(");
    statusString = statusString.replace("]", ")");

    try {
        const conn = await db.getPool().getConnection();
        const sql = 'select user_id, name, first_name, last_name, date_of_interest ' +
            'from event_attendees join attendance_status `as` on event_attendees.attendance_status_id = `as`.id ' +
            'join user u on u.id = event_attendees.user_id where event_id = ? and attendance_status_id IN ' + statusString +
            ' order by date_of_interest asc;';
        const [rows] = await conn.query(sql, eventId);
        conn.release();
        return rows;
    } catch (err) {
        console.log(err);
        throw (err);
    }
};

exports.getOneAttendee = async function (eventId, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'select user_id, name, first_name, last_name, date_of_interest ' +
            'from event_attendees join attendance_status `as` on event_attendees.attendance_status_id = `as`.id ' +
            'join user u on u.id = event_attendees.user_id where event_id = ? and user_id = ?' +
            ' order by date_of_interest asc;';
        const [rows] = await conn.query(sql, [eventId, userId]);
        conn.release();
        return rows;
    } catch (err) {
        console.log(err);
        throw (err);
    }
};

exports.addEventAttendee = async function (eventId, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'INSERT INTO event_attendees (event_id, user_id, date_of_interest, attendance_status_id) VALUES (?, ? , ?, ?)';
        await conn.query(sql, [eventId, userId, new Date(), 2]);
        conn.release();
    } catch (err) {
        throw (err);
    }
};

exports.deleteEventAttendee = async function (eventId, userId) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'DELETE FROM event_attendees where event_id = ? and user_id = ?';
        await conn.query(sql, [eventId, userId]);
        conn.release();
    } catch (err) {
        throw (err);
    }
};

exports.updateAttendeeStatus = async function (eventId, userId, status) {
    try {
        const conn = await db.getPool().getConnection();
        const sql = 'UPDATE event_attendees SET attendance_status_id = ? WHERE event_id = ? and user_id = ?';
        await conn.query(sql, [status, eventId, userId]);
        conn.release();
    } catch (err) {
        throw (err);
    }
};